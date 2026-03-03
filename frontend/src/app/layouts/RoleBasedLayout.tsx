import { Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { MainLayout } from "./MainLayout";
import { DeveloperLayout } from "./DeveloperLayout";

export function RoleBasedLayout() {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (user?.role === "developer") {
        return <DeveloperLayout />;
    }

    return <MainLayout />;
}
