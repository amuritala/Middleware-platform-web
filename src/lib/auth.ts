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
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || "/consolidated/api";

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
  if (!token) return null;
  if (!isAccessTokenValid(token)) {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    return null;
  }
  return token;
}

export async function loginWithCredentials(
  username: string,
  password: string,
): Promise<string> {
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

  if (
    typeof body !== "object" ||
    body === null ||
    !("access_token" in body) ||
    typeof body.access_token !== "string" ||
    !isAccessTokenValid(body.access_token)
  ) {
    throw new Error("The authentication service returned an invalid access token");
  }

  return body.access_token;
}

export function storeAccessToken(token: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}
