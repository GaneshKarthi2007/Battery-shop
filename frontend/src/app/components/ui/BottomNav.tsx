import { useNavigate, useLocation } from "react-router";
import { motion } from "framer-motion";
import { LayoutDashboard, ShoppingCart, Wrench, Menu, ClipboardList, History, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface BottomNavProps {
    onMenuClick: () => void;
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Switch the middle icon dynamically based on the associated permissions.
    const navItems = user?.role === "admin" 
        ? [
            { name: "Home", path: "/", icon: LayoutDashboard },
            { name: "Billing", path: "/sales", icon: ShoppingCart },
            { name: "Service", path: "/service", icon: Wrench },
        ]
        : [
            { name: "My Jobs", path: "/assigned-jobs", icon: Wrench },
            { name: "Available", path: "/available-jobs", icon: ClipboardList },
            { name: "History", path: "/completed-jobs", icon: History },
            { name: "Settings", path: "/settings", icon: SettingsIcon },
        ];

    const isActive = (path: string) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-20 flex justify-center">
            <div className="w-full max-w-[350px] bg-white/95 backdrop-blur-xl border border-gray-200 flex items-center p-1 justify-between relative overflow-hidden rounded-3xl transition-colors">

                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="relative flex-1 py-1.5 px-1 rounded-2xl outline-none transition-colors overflow-hidden group"
                        >
                            {/* Sliding Active Background */}
                            {active && (
                                <motion.div
                                    layoutId="activeTabPill"
                                    className="absolute inset-0 bg-blue-50 z-0 rounded-2xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            <div className="flex flex-col items-center gap-1 relative z-10 w-full text-center">
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className={`${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-800"} transition-colors`}
                                >
                                    <Icon className="w-5 h-5" />
                                </motion.div>
                                <span className={`text-[9px] font-bold tracking-tight ${active ? "text-blue-600" : "text-gray-500"} transition-colors`}>
                                    {item.name}
                                </span>
                            </div>
                        </button>
                    );
                })}

                <button
                    onClick={onMenuClick}
                    className="relative flex-1 py-1 px-1 h-full flex flex-col items-center justify-center outline-none transition-colors group z-10 hover:bg-gray-100 rounded-2xl"
                >
                    <div className="flex flex-col items-center gap-1 relative z-10 w-full text-center">
                        <motion.div whileTap={{ scale: 0.9 }} className="text-gray-500 group-hover:text-gray-800 transition-colors">
                            <Menu className="w-5 h-5" />
                        </motion.div>
                        <span className="text-[9px] font-bold tracking-tight text-gray-500">
                            Menu
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
}
