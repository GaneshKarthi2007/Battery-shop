import { useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { LogOut, Code2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export function DeveloperLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Developer Header */}
            <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-20 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center">
                        <Code2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-gray-900 text-lg">PowerCell Pro - Developer Console</span>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4 ml-auto">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900">{user?.name || 'Developer'}</p>
                        <p className="text-xs font-medium text-gray-500">{user?.email || 'dev@example.com'}</p>
                    </div>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:block">Exit Workspace</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="py-4 text-center border-t border-gray-200 mt-auto bg-white">
                <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">System Control Workspace • Build v2.0</p>
            </footer>

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutConfirm(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 350 }}
                            className="bg-white dark:bg-[#0D1B2A] border border-gray-200 dark:border-[#2E3B55] rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-red-100 dark:border-red-900/30">
                                <LogOut className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Confirm Logout</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-8">Are you sure you want to logout?</p>
                            
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-3 px-4 bg-gray-100 dark:bg-[#161D30] hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all text-sm active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all text-sm active:scale-95"
                                >
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
