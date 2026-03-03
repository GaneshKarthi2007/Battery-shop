import { useNavigate, useLocation } from "react-router";

import { motion } from "framer-motion";
import {
    LayoutDashboard,
    ShoppingCart,
    Wrench,
    Menu,
} from "lucide-react";

interface BottomNavProps {
    onMenuClick: () => void;
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { name: "Home", path: "/", icon: LayoutDashboard },
        { name: "Billing", path: "/sales", icon: ShoppingCart },
        { name: "Service", path: "/service", icon: Wrench },
    ];

    const filteredNavItems = navItems;

    const isActive = (path: string) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full z-50">
            <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex items-center p-1 gap-1 justify-between">
                {filteredNavItems.map((item) => {
                    if (!item) return null;
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="relative flex-1 py-2 px-1 outline-none transition-colors"
                        >
                            <div className="flex flex-col items-center gap-1 relative z-10 transition-colors duration-300">
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className={`${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
                                >
                                    <Icon className="w-5 h-5" />
                                </motion.div>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${active ? "text-blue-600" : "text-gray-400"}`}>
                                    {item.name}
                                </span>
                            </div>

                            {active && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-blue-50 rounded-xl z-0"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    );
                })}

                {/* Vertical Divider */}
                <div className="w-[1px] h-6 bg-gray-100 mx-1" />

                {/* Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="relative flex-1 py-2 px-1 outline-none transition-colors"
                >
                    <div className="flex flex-col items-center gap-1 relative z-10 text-gray-400 hover:text-gray-600 transition-colors">
                        <motion.div whileTap={{ scale: 0.9 }}>
                            <Menu className="w-5 h-5" />
                        </motion.div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                            Menu
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
}
