import type { ReactNode } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import LandingPage from "./domains/landing-page/LandingPage";
// import RegisterPage from "./domains/auth/RegisterPage";
import LoginPage from "./domains/auth/LoginPage";
import ForcePasswordChangePage from "./domains/auth/ForcePasswordChangePage";
import AdminDashboard from "./domains/dashboard/admin/AdminDashboard";
import VendorDashboard from "./domains/dashboard/vendor/VendorDashboard";
import ServicesPage from "./domains/dashboard/components/ServicesPage";
import ClientsPage from "./domains/dashboard/admin/ClientsPage";
import UsersPage from "./domains/dashboard/admin/UsersPage";
import RoleRequestsPage from "./domains/dashboard/admin/RoleRequestsPage";
import AuditPage from "./domains/dashboard/admin/AuditPage";
import SettingsPage from "./domains/dashboard/admin/SettingsPage";
import UserManagementPage from "./domains/dashboard/user-management/UserManagementPage";
import ProtectedRoute from "./domains/dashboard/components/ProtectedRoute";
import PermissionRoute from "./domains/dashboard/components/PermissionRoute";
import logo from "./assets/skybank-logo.png";
import { useAuth } from "./lib/useAuth";
import { useAdminSession } from "./lib/adminSession";

function portalRole(roles: string[]): "admin" | "vendor" | null {
  if (roles.includes("ROLE_ADMIN")) return "admin";
  if (roles.includes("ROLE_CLIENT") || roles.includes("ROLE_VENDOR")) {
    return "vendor";
  }
  return null;
}

/**
 * While the temporary password still stands, every screen except the change-password
 * screen is off limits - for vendors and administrators alike. The server enforces this
 * too; this gate is what makes the rule visible.
 */
function PasswordGate({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { mustChangePassword, status } = useAdminSession();
  const location = useLocation();

  if (!isAuthenticated) return <>{children}</>;

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-orange-500 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  const onPasswordScreen = location.pathname === "/change-password";
  if (mustChangePassword && !onPasswordScreen) {
    return <Navigate to="/change-password" replace />;
  }
  if (!mustChangePassword && onPasswordScreen) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RoleRedirect() {
  const { claims, isAuthenticated, logout } = useAuth();
  const roles = claims?.realm_access?.roles ?? [];
  const userRole = portalRole(roles);

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (!userRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-slate-50 via-purple-50/40 to-orange-50/30 p-6 text-center">
        <img src={logo} alt="Sky Bank Sierra Leone" className="h-20 w-auto" />
        <p className="text-gray-600">
          Your account does not have access to a Sky Bank portal.
        </p>
        <button
          type="button"
          onClick={logout}
          className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  if (userRole === "admin") {
    return <Navigate to="/admin-dashboard" replace />;
  }

  if (userRole === "vendor") {
    return <Navigate to="/vendor-dashboard" replace />;
  }

  return <LandingPage />;
}

function App() {
  const { claims } = useAuth();
  const userRole = portalRole(claims?.realm_access?.roles ?? []);

  return (
    <PasswordGate>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />

        {/* <Route
                    path="/register"
                    element={<RegisterPage />}
                /> */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<ForcePasswordChangePage />} />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole="admin" userRole={userRole}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendor-dashboard"
          element={
            <ProtectedRoute requiredRole="vendor" userRole={userRole}>
              <VendorDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/services" element={<ServicesPage />} />

        {/* Settings is available to both portals and reads the role live from the token. */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredRole={userRole ?? ""} userRole={userRole}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Administration - coarse gate on ROLE_ADMIN, fine gate on the
                    governance permission each screen belongs to. */}
        <Route
          path="/admin/clients"
          element={
            <ProtectedRoute requiredRole="admin" userRole={userRole}>
              <PermissionRoute permission="view.clients">
                <ClientsPage />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/role-requests"
          element={
            <ProtectedRoute requiredRole="admin" userRole={userRole}>
              <PermissionRoute permission="view.role_requests">
                <RoleRequestsPage />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole="admin" userRole={userRole}>
              <PermissionRoute permission="initiate.service_assignment">
                <UsersPage />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user-management"
          element={
            <ProtectedRoute requiredRole="admin" userRole={userRole}>
              <PermissionRoute permission="view.approvals">
                <UserManagementPage />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute requiredRole="admin" userRole={userRole}>
              <PermissionRoute permission="view.audit">
                <AuditPage />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
    </PasswordGate>
  );
}

export default App;
