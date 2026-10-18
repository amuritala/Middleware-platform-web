import { useContext } from "react";
import { AuthContext } from "./authContext";
import type { AuthContextValue } from "./authContext";

export function useAuth(): AuthContextValue {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return auth;
}
