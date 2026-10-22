import { API_BASE_URL } from "./apiBaseUrl";

export interface TokenClaims {
  exp?: number;
  email?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  realm_access?: {
    roles?: string[];
  };
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
}

const ACCESS_TOKEN_KEY = "skybank_access_token";
const REFRESH_TOKEN_KEY = "skybank_refresh_token";
/** Refresh this long before the access token expires. */
export const REFRESH_LEEWAY_MS = 60_000;
const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL?.trim() || API_BASE_URL;

export function parseAccessToken(token: string): TokenClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (character) =>
      character.charCodeAt(0),
    );
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof value !== "object" || value === null) return null;

    const claims = value as Record<string, unknown>;
    const realmAccess = claims.realm_access;
    const roles =
      typeof realmAccess === "object" &&
      realmAccess !== null &&
      "roles" in realmAccess &&
      Array.isArray(realmAccess.roles)
        ? realmAccess.roles.filter(
            (role): role is string => typeof role === "string",
          )
        : undefined;

    return {
      ...(typeof claims.exp === "number" ? { exp: claims.exp } : {}),
      ...(typeof claims.email === "string" ? { email: claims.email } : {}),
      ...(typeof claims.given_name === "string"
        ? { given_name: claims.given_name }
        : {}),
      ...(typeof claims.family_name === "string"
        ? { family_name: claims.family_name }
        : {}),
      ...(typeof claims.preferred_username === "string"
        ? { preferred_username: claims.preferred_username }
        : {}),
      ...(roles ? { realm_access: { roles } } : {}),
    };
  } catch {
    return null;
  }
}

export function isAccessTokenValid(token: string): boolean {
  const claims = parseAccessToken(token);
  return typeof claims?.exp === "number" && claims.exp * 1000 > Date.now();
}

export function getAccessToken(): string | null {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token || !isAccessTokenValid(token)) return null;
  return token;
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string | null;
}

function readTokenPair(body: unknown): TokenPair {
  if (
    typeof body !== "object" ||
    body === null ||
    !("access_token" in body) ||
    typeof body.access_token !== "string" ||
    !isAccessTokenValid(body.access_token)
  ) {
    throw new Error("The authentication service returned an invalid access token");
  }
  const refreshToken =
    "refresh_token" in body &&
    typeof body.refresh_token === "string" &&
    body.refresh_token
      ? body.refresh_token
      : null;
  return { accessToken: body.access_token, refreshToken };
}

export async function loginWithCredentials(
  username: string,
  password: string,
): Promise<TokenPair> {
  const response = await fetch(`${AUTH_API_URL.replace(/\/$/, "")}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const messageFields = ["message", "detail", "error"] as const;
    let message = "Invalid username or password";
    if (typeof body === "object" && body !== null) {
      const errorBody = body as Record<string, unknown>;
      message =
        messageFields
          .map((field) =>
            typeof errorBody[field] === "string" ? errorBody[field] : null,
          )
          .find((value): value is string => value !== null) ?? message;
    }
    throw new Error(message);
  }

  return readTokenPair(body);
}

export function storeTokens(tokens: TokenPair): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Revokes the refresh token on the server (ending the Keycloak session), then clears
 * local tokens. Local tokens are cleared even if the call fails, so the user is always
 * signed out in this browser.
 */
export async function revokeSession(): Promise<void> {
  const refreshToken = getRefreshToken();
  clearAccessToken();
  if (!refreshToken) return;
  try {
    await fetch(`${AUTH_API_URL.replace(/\/$/, "")}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      keepalive: true,
    });
  } catch {
    // Offline or unreachable: the refresh token still expires on its own.
  }
}

type TokenListener = (accessToken: string | null) => void;
const tokenListeners = new Set<TokenListener>();

/** Notified when a refresh stores a new access token, or ends the session (null). */
export function onTokenChange(listener: TokenListener): () => void {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}

function notifyTokenChange(accessToken: string | null): void {
  tokenListeners.forEach((listener) => listener(accessToken));
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Exchanges the refresh token for a new token pair. Concurrent callers share one
 * request, since Keycloak rotates refresh tokens and a second use of the old one fails.
 * Resolves null when the session is over (the server rejected the refresh token, which
 * also clears the stored tokens); throws when the service is temporarily unreachable,
 * leaving the session intact so the caller can retry.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.resolve(null);

  refreshInFlight = (async () => {
    const response = await fetch(
      `${AUTH_API_URL.replace(/\/$/, "")}/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    );

    if (response.status === 400 || response.status === 401) {
      clearAccessToken();
      notifyTokenChange(null);
      return null;
    }
    if (!response.ok) {
      throw new Error("The authentication service is unavailable");
    }

    const tokens = readTokenPair(await response.json().catch(() => null));
    storeTokens(tokens);
    notifyTokenChange(tokens.accessToken);
    return tokens.accessToken;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

/** Returns a token that is valid for at least the refresh leeway, refreshing if needed. */
export async function getValidAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  const expiresAt = token ? (parseAccessToken(token)?.exp ?? 0) * 1000 : 0;
  if (token && expiresAt - Date.now() > REFRESH_LEEWAY_MS) return token;

  try {
    return (await refreshAccessToken()) ?? token;
  } catch {
    return token;
  }
}
import { API_BASE_URL } from "./apiBaseUrl";
