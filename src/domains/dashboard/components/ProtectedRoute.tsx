import { Navigate } from "react-router-dom";
import { useAuth } from "../../../lib/useAuth";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole: string;
    userRole: string | null;
}

export default function ProtectedRoute({
    children,
    requiredRole,
    userRole
}: ProtectedRouteProps) {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!userRole) {
        return <Navigate to="/" replace />;
    }

    if (userRole !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}