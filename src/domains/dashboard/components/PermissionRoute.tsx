import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../lib/useAuth";
import { useAdminSession } from "../../../lib/adminSession";

interface PermissionRouteProps {
  children: ReactNode;
  /** Permission key from the role's permission list, e.g. "initiate.vendor_registration". */
  permission: string;
}

/**
 * Blocks a screen until the caller's governance role grants the permission. Waits for the
 * /me fetch instead of bouncing during load, and sends unauthorized administrators back to
 * their dashboard rather than to a dead end.
 */
export default function PermissionRoute({ children, permission }: PermissionRouteProps) {
  const { isAuthenticated } = useAuth();
  const { can, status } = useAdminSession();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 text-orange-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-xs font-medium text-gray-400">Checking your access…</p>
        </div>
      </div>
    );
  }

  if (!can(permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
