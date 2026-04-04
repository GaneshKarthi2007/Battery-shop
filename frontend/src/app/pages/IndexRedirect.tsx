import { Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Dashboard } from "./Dashboard";

export function IndexRedirect() {
    const { user } = useAuth();

    if (user?.role === "developer") {
        return <Navigate to="/developer" replace />;
    }

    if (user?.role === "staff") {
        return <Navigate to="/assigned-jobs" replace />;
    }

    return <Dashboard />;
}
