import { Bell, ShoppingBag, Package, Wrench, FileText, Circle } from "lucide-react";
import { useNotifications, NotificationType } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const { user } = useAuth();

    if (!user) return null;

    // Filter notifications based on user role
    const filteredNotifications = notifications.filter(n => n.role === user.role);

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case "SALES": return <ShoppingBag className="w-4 h-4 text-green-600" />;
            case "STOCK": return <Package className="w-4 h-4 text-orange-600" />;
            case "SERVICE": return <Wrench className="w-4 h-4 text-blue-600" />;
            case "SUMMARY": return <FileText className="w-4 h-4 text-purple-600" />;
            default: return <Bell className="w-4 h-4 text-gray-600" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={onClose}></div>
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-20 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                Notifications
                                {filteredNotifications.length > 0 && (
                                    <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                        {filteredNotifications.filter(n => !n.isRead).length} New
                                    </span>
                                )}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                                >
                                    Mark all read
                                </button>
                                <button
                                    onClick={clearAll}
                                    className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {filteredNotifications.length === 0 ? (
                                <div className="py-12 text-center text-gray-500">
                                    <div className="mb-3 flex justify-center">
                                        <Bell className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-solid divide-gray-50">
                                    {filteredNotifications.map((notif) => (
                                        <button
                                            key={notif.id}
                                            onClick={() => markAsRead(notif.id)}
                                            className={`w-full px-4 py-4 text-left transition-colors flex gap-3 hover:bg-gray-50 ${!notif.isRead ? "bg-blue-50/30" : ""}`}
                                        >
                                            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${notif.type === 'SALES' ? 'bg-green-100' :
                                                notif.type === 'STOCK' ? 'bg-orange-100' :
                                                    notif.type === 'SERVICE' ? 'bg-blue-100' : 'bg-purple-100'
                                                }`}>
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className={`text-sm font-bold truncate ${!notif.isRead ? "text-gray-900" : "text-gray-600"}`}>
                                                        {notif.title}
                                                    </p>
                                                    {!notif.isRead && <Circle className="w-2 h-2 fill-blue-600 text-blue-600 flex-shrink-0" />}
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-1.5">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-medium">
                                                    {notif.time}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {filteredNotifications.length > 0 && (
                            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 text-center">
                                <button className="text-xs font-bold text-gray-500 hover:text-blue-600">
                                    View full history
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
