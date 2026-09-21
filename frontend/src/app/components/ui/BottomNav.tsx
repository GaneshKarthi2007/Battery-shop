import { useNavigate, useLocation } from "react-router";
import { motion } from "framer-motion";
import { LayoutDashboard, ShoppingCart, Wrench, Package, ClipboardList, History, Settings } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface BottomNavProps {
    onMenuClick?: () => void;
}

export function BottomNav(_props: BottomNavProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    if (!user) return null;

    const isAdmin = user.role === "admin";

    // Replaced with original icons, 5-item compact layout
    const navItems = isAdmin
        ? [
            { id: "home", name: "Home", path: "/", icon: LayoutDashboard },
            { id: "sales", name: "Billing", path: "/sales", icon: ShoppingCart },
            { id: "service", name: "Service", path: "/service", icon: Wrench, isCenter: true },
            { id: "inventory", name: "Inventory", path: "/inventory", icon: Package },
            { id: "profile", name: "Settings", path: "/settings", isProfile: true },
        ]
        : [
            { id: "jobs", name: "My Jobs", path: "/assigned-jobs", icon: Wrench },
            { id: "available", name: "Available", path: "/available-jobs", icon: ClipboardList },
            { id: "service", name: "Service", path: "/service", icon: Wrench, isCenter: true },
            { id: "history", name: "History", path: "/completed-jobs", icon: History },
            { id: "profile", name: "Settings", path: "/settings", isProfile: true },
        ];

    const isActive = (path?: string) => {
        if (!path) return false;
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-r border-l border-gray-200/80 px-3 py-1 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="max-w-md mx-auto flex items-center justify-between relative">
                {navItems.map((item) => {
                    const active = isActive(item.path);

                    if (item.isProfile) {
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path!)}
                                className="relative flex flex-col items-center justify-center p-1 rounded-full transition-transform active:scale-90"
                                title="Settings & Profile"
                            >
                                <div className={`w-6 h-6 rounded-full p-0.5 border transition-colors overflow-hidden ${
                                    active ? "border-gray-900 ring-2 ring-gray-900/20" : "border-gray-300 hover:border-gray-400"
                                }`}>
                                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black uppercase">
                                        {user.name ? user.name.charAt(0) : <Settings className="w-3 h-3 text-white" />}
                                    </div>
                                </div>
                            </button>
                        );
                    }

                    const Icon = item.icon!;

                    if (item.isCenter) {
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path!)}
                                className="relative flex flex-col items-center justify-center p-1 transition-transform active:scale-90"
                                title={item.name}
                            >
                                <div className={`p-1.5 rounded-xl transition-all ${
                                    active ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:text-black"
                                }`}>
                                    <Icon className="w-5.5 h-5.5 stroke-[2]" />
                                </div>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path!)}
                            className="relative flex flex-col items-center justify-center p-1.5 rounded-xl transition-transform active:scale-90 group"
                            title={item.name}
                        >
                            <div className="relative">
                                <Icon className={`w-5 h-5 transition-colors duration-200 stroke-[1.8] ${
                                    active ? "text-gray-900" : "text-gray-500 hover:text-gray-900"
                                }`} />
                                {active && (
                                    <motion.div
                                        layoutId="bottomNavDot"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-900 rounded-full"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}


