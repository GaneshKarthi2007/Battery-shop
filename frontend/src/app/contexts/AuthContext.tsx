import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient } from "../api/client";

export type UserRole = "admin" | "staff" | "developer" | "manager";

interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem("powercell_user") || sessionStorage.getItem("powercell_user");
        const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
        if (savedUser && token) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user from storage", e);
                localStorage.removeItem("powercell_user");
                localStorage.removeItem("auth_token");
                sessionStorage.removeItem("powercell_user");
                sessionStorage.removeItem("auth_token");
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string, rememberMe: boolean = true) => {
        try {
            const response = await apiClient.post<{ access_token: string, user: any }>('/login', { email, password });
            const userData: User = {
                id: response.user.id,
                name: response.user.name,
                email: response.user.email,
                role: response.user.role as UserRole,
            };
            setUser(userData);
            if (rememberMe) {
                localStorage.setItem("auth_token", response.access_token);
                localStorage.setItem("powercell_user", JSON.stringify(userData));
                sessionStorage.removeItem("auth_token");
                sessionStorage.removeItem("powercell_user");
            } else {
                sessionStorage.setItem("auth_token", response.access_token);
                sessionStorage.setItem("powercell_user", JSON.stringify(userData));
                localStorage.removeItem("auth_token");
                localStorage.removeItem("powercell_user");
            }
            // Let DeveloperContext re-fetch shop settings for this session
            window.dispatchEvent(new Event("auth:changed"));
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("powercell_user");
        localStorage.removeItem("auth_token");
        sessionStorage.removeItem("powercell_user");
        sessionStorage.removeItem("auth_token");
    };

    if (loading) {
        return null; // Or a loading spinner
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
