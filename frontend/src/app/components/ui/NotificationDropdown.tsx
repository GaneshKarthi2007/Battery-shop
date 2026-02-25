import { Bell, ShoppingBag, Package, Wrench, FileText } from "lucide-react";
import { useNotifications, NotificationType } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const { user } = useAuth();

    if (!user) return null;

    // Filter notifications based on user role
    const filteredNotifications = notifications.filter(n => n.role === user.role);

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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-10 bg-black/5 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(10px)" }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="absolute right-0 mt-3 w-[22rem] sm:w-[26rem] bg-white/80 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/20 z-20 overflow-hidden ring-1 ring-black/5"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-200/50 flex items-center justify-between bg-white/40">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2.5">
                                <div className="p-1.5 bg-blue-600 rounded-lg">
                                    <Bell className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-lg tracking-tight">Activity</span>
                                {filteredNotifications.length > 0 && (
                                    <span className="bg-blue-600/10 text-blue-600 text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        {filteredNotifications.filter(n => !n.isRead).length} New
                                    </span>
                                )}
                            </h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[11px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors duration-200"
                                >
                                    Catch up
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="text-[11px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors duration-200"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[32rem] overflow-y-auto scrollbar-hide py-2">
                            {filteredNotifications.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="py-16 text-center"
                                >
                                    <div className="mb-4 flex justify-center relative">
                                        <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse" />
                                        <Bell className="w-12 h-12 text-blue-200 relative z-10" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-400">All caught up!</p>
                                    <p className="text-xs text-gray-300 mt-1">No new alerts for you.</p>
                                </motion.div>
                            ) : (
                                <div className="space-y-4">
                                    {sections.map((section) => (
                                        <div key={section.title} className="px-2">
                                            <p className="px-3 pb-2 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                                {section.title}
                                            </p>
                                            <div className="space-y-1">
                                                {section.notifications.map((notif, idx) => (
                                                    <motion.button
                                                        layout
                                                        key={notif.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        onClick={() => markAsRead(notif.id)}
                                                        className={`w-full px-3 py-3 rounded-xl text-left transition-all duration-300 flex gap-3.5 group relative hover:scale-[1.015] active:scale-[0.98] ${!notif.isRead
                                                            ? "bg-white shadow-sm ring-1 ring-blue-500/10 hover:shadow-md"
                                                            : "hover:bg-black/5"
                                                            }`}
                                                    >
                                                        <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6 ${notif.type === 'SALES' ? 'bg-emerald-50' :
                                                            notif.type === 'STOCK' ? 'bg-amber-50' :
                                                                notif.type === 'SERVICE' ? 'bg-sky-50' : 'bg-indigo-50'
                                                            }`}>
                                                            {getIcon(notif.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2 mb-0.5">
                                                                <p className={`text-[0.9rem] font-bold leading-snug tracking-tight ${!notif.isRead ? "text-slate-900" : "text-slate-500"}`}>
                                                                    {notif.title}
                                                                </p>
                                                                {!notif.isRead && (
                                                                    <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                                                                )}
                                                            </div>
                                                            <p className={`text-xs leading-relaxed mb-2 line-clamp-2 ${!notif.isRead ? "text-slate-600" : "text-slate-400"}`}>
                                                                {notif.message}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                    {notif.time}
                                                                </span>
                                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${notif.type === 'SALES' ? 'text-emerald-600' :
                                                                    notif.type === 'STOCK' ? 'text-amber-600' :
                                                                        notif.type === 'SERVICE' ? 'text-sky-600' : 'text-indigo-600'
                                                                    }`}>
                                                                    {notif.type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {filteredNotifications.length > 0 && (
                            <div className="px-5 py-3 border-t border-gray-100 bg-white/40 text-center">
                                <button className="text-[11px] font-black text-gray-500 hover:text-blue-600 uppercase tracking-[0.2em] transition-colors">
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
