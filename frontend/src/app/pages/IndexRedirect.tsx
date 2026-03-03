import { Navigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Dashboard } from "./Dashboard";

export function IndexRedirect() {
    const { user } = useAuth();

    // Developers don't get a standard dashboard, bounce them to settings
    if (user?.role === "developer") {
        return <Navigate to="/developer" replace />;
    }

    return <Dashboard />;
}
