import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { accountApi, governanceApi } from "./api";
import { useAuth } from "./useAuth";
import type { AdminMe, AdminGovernanceRole } from "./types";

interface AdminSessionValue {
  /** The governance profile, null while signed out or for accounts without a local row. */
  me: AdminMe | null;
  /** "loading" until both /me and the credential check have settled. */
  status: "loading" | "ready";
  /** True while the temporary password still has to be replaced - blocks every other screen. */
  mustChangePassword: boolean;
  /** Permission check against the role's permission keys, e.g. can("initiate.vendor_registration"). */
  can: (permission: string) => boolean;
  isRole: (role: AdminGovernanceRole) => boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionValue | null>(null);

/**
 * Loads the signed-in user's governance profile once per page load. The four admin roles
 * live in the local database (not the JWT), so every screen and button derives from this
 * context, and the forced-password-change flag comes from the same fetch.
 */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [me, setMe] = useState<AdminMe | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  const load = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setMe(null);
      setMustChangePassword(false);
      setStatus("ready");
      return;
    }
    setStatus("loading");
    // Credentials apply to every signed-in user (vendors too); /me is admin-only.
    const credentials = accountApi
      .getCredentials()
      .then((value) => setMustChangePassword(value.mustChangePassword))
      .catch(() => setMustChangePassword(false));

    const profile = governanceApi
      .me()
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setStatus("ready"));

    await Promise.all([credentials, profile]);
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<AdminSessionValue>(
    () => ({
      me,
      status,
      mustChangePassword,
      can: (permission) => !!me && me.permissions.includes(permission),
      isRole: (role) => me?.adminRole === role,
      isAdmin: !!me,
      refresh: load,
    }),
    [me, status, mustChangePassword, load],
  );

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession(): AdminSessionValue {
  const session = useContext(AdminSessionContext);
  if (!session) {
    throw new Error("useAdminSession must be used within an AdminSessionProvider");
  }
  return session;
}
