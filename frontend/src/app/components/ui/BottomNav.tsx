import { useNavigate, useLocation } from "react-router";
import { motion } from "framer-motion";
import { LayoutDashboard, ShoppingCart, Wrench, Menu } from "lucide-react";

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

    const isActive = (path: string) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    return (
        <div className="md:hidden fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
            <div className="w-full max-w-[320px] bg-white/90 backdrop-blur-xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl flex items-center p-1.5 justify-between relative overflow-hidden">

                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className="relative flex-1 py-2 px-1 rounded-2xl outline-none transition-colors overflow-hidden group"
                        >
                            {/* Sliding Active Background */}
                            {active && (
                                <motion.div
                                    layoutId="activeTabPill"
                                    className="absolute inset-0 bg-blue-50 z-0 rounded-2xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            <div className="flex flex-col items-center gap-1 relative z-10">
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className={`${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"} transition-colors`}
                                >
                                    <Icon className="w-5 h-5" />
                                </motion.div>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${active ? "text-blue-600" : "text-gray-400"} transition-colors`}>
                                    {item.name}
                                </span>
                            </div>
                        </button>
                    );
                })}

                <div className="w-[1px] h-6 bg-gray-200 mx-1 rounded-full z-10" />

                <button
                    onClick={onMenuClick}
                    className="relative flex-1 py-2 px-1 outline-none transition-colors group z-10 rounded-2xl hover:bg-gray-50"
                >
                    <div className="flex flex-col items-center gap-1 relative z-10">
                        <motion.div whileTap={{ scale: 0.9 }} className="text-gray-400 group-hover:text-gray-600 transition-colors">
                            <Menu className="w-5 h-5" />
                        </motion.div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                            Menu
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
}
