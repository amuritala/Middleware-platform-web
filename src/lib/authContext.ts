import { createContext } from "react";
import type { TokenClaims } from "./auth";

export interface AuthContextValue {
  accessToken: string | null;
  claims: TokenClaims | null;
  isAuthenticated: boolean;
  /**
   * True while the signed-in user still holds an administrator's temporary password.
   * The app routes these users to the change-password screen and nowhere else.
   */
  mustChangePassword: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  /** Re-reads the credential state from the API - call after a password change. */
  refreshCredentials: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
