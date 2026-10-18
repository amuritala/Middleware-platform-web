import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AuthContext } from "./authContext";
import { accountApi } from "./api";
import {
  clearAccessToken,
  getAccessToken,
  isAccessTokenValid,
  loginWithCredentials,
  parseAccessToken,
  storeAccessToken,
} from "./auth";

function loadSavedToken(): string | null {
  return getAccessToken();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(loadSavedToken);
  /**
   * Admin-created vendors sign in with a temporary password and must replace it before
   * the rest of the portal unlocks. Defaults to false so a slow or older backend never
   * locks anyone out.
   */
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const refreshCredentials = useCallback(async () => {
    if (!getAccessToken()) {
      // Nothing to check; logout() has already reset the flag to false.
      return;
    }
    try {
      const { mustChangePassword: required } =
        await accountApi.getCredentials();
      setMustChangePassword(required);
    } catch {
      // The check is a UX gate, not a security boundary - on failure, let the user in.
      setMustChangePassword(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setAccessToken(null);
    setMustChangePassword(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const token = await loginWithCredentials(username, password);
    storeAccessToken(token);
    setAccessToken(token);
  }, []);

  // Refresh the flag whenever the signed-in user changes. The fetch lives in the effect
  // so state is only written from the promise callbacks, never synchronously.
  useEffect(() => {
    if (!getAccessToken()) return;
    let cancelled = false;
    accountApi
      .getCredentials()
      .then((result) => {
        if (!cancelled) setMustChangePassword(result.mustChangePassword);
      })
      .catch(() => {
        // The check is a UX gate, not a security boundary - on failure, let the user in.
        if (!cancelled) setMustChangePassword(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    const timer = window.setInterval(() => {
      if (!isAccessTokenValid(accessToken)) logout();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [accessToken, logout]);

  const value = useMemo(() => {
    const validToken =
      accessToken && isAccessTokenValid(accessToken) ? accessToken : null;
    return {
      accessToken: validToken,
      claims: validToken ? parseAccessToken(validToken) : null,
      isAuthenticated: validToken !== null,
      mustChangePassword,
      login,
      logout,
      refreshCredentials,
    };
  }, [accessToken, mustChangePassword, login, logout, refreshCredentials]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
