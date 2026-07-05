import { Bell, ShoppingBag, Package, Wrench, FileText, Check, Inbox } from "lucide-react";
import { useNotifications, NotificationType } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { useState } from "react";

export function NotificationDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'ALL' | 'SALES' | 'SERVICE' | 'STOCK' | 'SUMMARY'>('ALL');

    if (!user) return null;

    // Filter notifications based on tab
    const filteredNotifications = activeTab === 'ALL'
        ? notifications
        : notifications.filter(n => n.type === activeTab);

    // Grouping logic
    const sections = [
        { title: "Today", notifications: filteredNotifications.filter(n => new Date(n.createdAt).toDateString() === new Date().toDateString()) },
        { title: "Yesterday", notifications: filteredNotifications.filter(n => new Date(n.createdAt).toDateString() === new Date(Date.now() - 86400000).toDateString()) },
        {
            title: "Earlier", notifications: filteredNotifications.filter(n => {
                const date = new Date(n.createdAt).toDateString();
                const today = new Date().toDateString();
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                return date !== today && date !== yesterday;
            })
        }
    ].filter(s => s.notifications.length > 0);

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case "SALES": return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
            case "STOCK": return <Package className="w-4 h-4 text-amber-500" />;
            case "SERVICE": return <Wrench className="w-4 h-4 text-sky-500" />;
            case "SUMMARY": return <FileText className="w-4 h-4 text-indigo-500" />;
            default: return <Bell className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop click closer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/10 dark:bg-black/40 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none"
                        onClick={onClose}
                    />
                    
                    {/* Floating Dropdown Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(4px)" }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[26rem] max-w-[26rem] bg-white/95 dark:bg-[#0D1B2A]/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-200/50 dark:border-white/5 z-50 overflow-hidden ring-1 ring-black/5"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-white/5 dark:to-white/0">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                                <div className="p-1.5 bg-blue-600 rounded-lg shadow-md shadow-blue-500/20">
                                    <Bell className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-black uppercase tracking-wider">Notifications</span>
                                {filteredNotifications.length > 0 && (
                                    <span className="bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        {filteredNotifications.filter(n => !n.isRead).length} New
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center gap-3">
                                {filteredNotifications.some(n => !n.isRead) && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-wider transition-colors duration-200"
                                    >
                                        Read All
                                    </button>
                                )}
                                <button
                                    onClick={clearAll}
                                    className="text-[10px] font-black text-gray-400 hover:text-red-500 dark:hover:text-red-400 uppercase tracking-wider transition-colors duration-200"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Category Filter Pills */}
                        <div className="px-4 py-2 border-b border-gray-150/40 dark:border-white/5 flex gap-2 overflow-x-auto scrollbar-hide bg-gray-50/40 dark:bg-black/20">
                            {(["ALL", "SALES", "SERVICE", "STOCK", "SUMMARY"] as const).map((tab) => {
                                const count = tab === 'ALL'
                                    ? notifications.filter(n => !n.isRead).length
                                    : notifications.filter(n => n.type === tab && !n.isRead).length;

                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap ${
                                            activeTab === tab
                                                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                        }`}
                                    >
                                        {tab === 'ALL' ? 'All' : tab.toLowerCase()}
                                        {count > 0 && (
                                            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === tab ? 'bg-white' : 'bg-blue-500'}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[26rem] overflow-y-auto scrollbar-hide py-2">
                            {filteredNotifications.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="py-16 text-center animate-in fade-in"
                                >
                                    <div className="mb-3 flex justify-center relative">
                                        <div className="absolute inset-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-xl mx-auto opacity-50 animate-pulse" />
                                        <Inbox className="w-10 h-10 text-gray-300 dark:text-gray-700 relative z-10" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">All caught up!</p>
                                    <p className="text-xs text-gray-400/80 dark:text-gray-600 mt-1">No alerts found in this section.</p>
                                </motion.div>
                            ) : (
                                <div className="space-y-4">
                                    {sections.map((section) => (
                                        <div key={section.title} className="px-2">
                                            <p className="px-3 pb-2 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">
                                                {section.title}
                                            </p>
                                            <div className="space-y-1">
                                                {section.notifications.map((notif, idx) => (
                                                    <motion.div
                                                        layout
                                                        key={notif.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.03 }}
                                                        onClick={() => {
                                                            markAsRead(notif.id);
                                                            onClose();
                                                            
                                                            // Logic to navigate if it's a service notification
                                                            if (notif.type === "SERVICE") {
                                                                const match = notif.message.match(/Service #(\d+)/);
                                                                if (match && match[1]) {
                                                                    navigate(`/service/${match[1]}`);
                                                                } else {
                                                                    navigate("/service");
                                                                }
                                                            } else if (notif.type === "SALES") {
                                                                navigate("/sales");
                                                            }
                                                        }}
                                                        className={`w-full px-3 py-3 rounded-xl text-left transition-all duration-300 flex gap-3.5 group relative cursor-pointer border border-transparent ${
                                                            !notif.isRead
                                                                ? "bg-blue-50/30 dark:bg-blue-950/10 border-blue-500/10 dark:border-blue-500/5 hover:bg-blue-50/60 dark:hover:bg-blue-950/20"
                                                                : "hover:bg-gray-50 dark:hover:bg-white/5"
                                                        }`}
                                                    >
                                                        <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 ${
                                                            notif.type === 'SALES' ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/10 dark:border-emerald-500/5' :
                                                            notif.type === 'STOCK' ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-500/10 dark:border-amber-500/5' :
                                                            notif.type === 'SERVICE' ? 'bg-sky-50 dark:bg-sky-950/30 border border-sky-500/10 dark:border-sky-500/5' : 
                                                            'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-500/10 dark:border-indigo-500/5'
                                                        }`}>
                                                            {getIcon(notif.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2 mb-0.5">
                                                                <p className={`text-xs font-bold leading-snug tracking-tight ${
                                                                    !notif.isRead ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                                                                }`}>
                                                                    {notif.title}
                                                                </p>
                                                                {!notif.isRead && (
                                                                    <div className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                                                                )}
                                                            </div>
                                                            <p className={`text-[11px] leading-relaxed mb-2 line-clamp-2 ${
                                                                !notif.isRead ? "text-slate-600 dark:text-slate-350 font-medium" : "text-slate-400 dark:text-slate-500 font-normal"
                                                            }`}>
                                                                {notif.message}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                                    {notif.time}
                                                                </span>
                                                                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                                                                <span className={`text-[9px] font-black uppercase tracking-wider ${
                                                                    notif.type === 'SALES' ? 'text-emerald-600 dark:text-emerald-400' :
                                                                    notif.type === 'STOCK' ? 'text-amber-600 dark:text-amber-400' :
                                                                    notif.type === 'SERVICE' ? 'text-sky-600 dark:text-sky-400' : 
                                                                    'text-indigo-600 dark:text-indigo-400'
                                                                }`}>
                                                                    {notif.type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Mark as read quick shortcut on hover */}
                                                        {!notif.isRead && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markAsRead(notif.id);
                                                                }}
                                                                className="absolute right-3.5 bottom-3.5 p-1 bg-white hover:bg-blue-100 dark:bg-gray-800 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-lg shadow-sm border border-gray-150 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                                                                title="Mark as read"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Review Full Logs Link */}
                        {filteredNotifications.length > 0 && (
                            <div className="px-5 py-3.5 border-t border-gray-150/40 dark:border-white/5 bg-gray-50/20 dark:bg-black/10 text-center">
                                <button
                                    onClick={() => {
                                        navigate('/notifications');
                                        onClose();
                                    }}
                                    className="text-[10px] font-black text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-[0.2em] transition-colors"
                                >
                                    Review Full Logs
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
