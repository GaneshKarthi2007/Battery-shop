import { useState } from "react";
import { useNavigate } from "react-router";
import { useNotifications, NotificationType } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import { Bell, ShoppingBag, Package, Wrench, FileText, Check, Inbox, ArrowLeft, CheckCircle2, Trash2, Sliders } from "lucide-react";
import { PushNotificationManager } from "../components/PushNotificationManager";

function getRelativeTimeString(createdAt: string, timeFallback: string): string {
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return timeFallback || 'now';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${diffWeeks}w`;
}

export function Notifications() {
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'ALL' | 'SALES' | 'SERVICE' | 'STOCK' | 'SUMMARY'>('ALL');

    if (!user) return null;

    // Filter notifications based on tab
    const filteredNotifications = activeTab === 'ALL'
        ? notifications
        : notifications.filter(n => n.type === activeTab);

    // Time grouping
    const now = new Date().getTime();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    const featuredList = filteredNotifications.filter(n => !n.isRead);
    const nonFeaturedList = filteredNotifications.filter(n => !featuredList.some(f => f.id === n.id));

    const last7DaysList = nonFeaturedList.filter(n => {
        const time = new Date(n.createdAt).getTime();
        if (isNaN(time)) return true; // Default to recent if date string is unparseable
        const diff = now - time;
        return diff <= SEVEN_DAYS_MS;
    });

    const last30DaysList = nonFeaturedList.filter(n => {
        const time = new Date(n.createdAt).getTime();
        if (isNaN(time)) return false;
        const diff = now - time;
        return diff > SEVEN_DAYS_MS && diff <= THIRTY_DAYS_MS;
    });

    const earlierList = nonFeaturedList.filter(n => {
        const time = new Date(n.createdAt).getTime();
        if (isNaN(time)) return false;
        const diff = now - time;
        return diff > THIRTY_DAYS_MS;
    });

    const sections = [
        { title: "Unread & Featured", notifications: featuredList },
        { title: "Last 7 days", notifications: last7DaysList },
        { title: "Last 30 days", notifications: last30DaysList },
        { title: "Earlier", notifications: earlierList },
    ].filter(s => s.notifications.length > 0);

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case "SALES": return <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
            case "STOCK": return <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
            case "SERVICE": return <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
            case "SUMMARY": return <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
            default: return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
        }
    };

    const handleNotificationClick = (notif: typeof notifications[0]) => {
        markAsRead(notif.id);
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
    };

    return (
        <div className="max-w-2xl mx-auto pb-24 px-4 sm:px-6 pt-2 bg-white dark:bg-[#0D1B2A] text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#0D1B2A]/90 backdrop-blur-md py-3 mb-4 flex items-center justify-between border-b border-gray-100 dark:border-[#2E3B55]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-full transition-colors active:scale-95"
                        title="Go Back"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight uppercase">Notifications</h1>
                </div>

                <div className="flex items-center gap-2">
                    {filteredNotifications.some(n => !n.isRead) && (
                        <button
                            onClick={markAllAsRead}
                            className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full transition-colors"
                        >
                            Mark Read
                        </button>
                    )}
                    {filteredNotifications.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors"
                            title="Clear all notifications"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/notification-management')}
                        className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-full transition-colors relative"
                        title="Notification Settings & Controls"
                    >
                        <Sliders className="w-5 h-5" />
                        {notifications.some(n => !n.isRead) && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0D1B2A]" />
                        )}
                    </button>
                </div>
            </div>

            {/* Push Notification Manager Card */}
            <PushNotificationManager className="mb-4" />

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide border-b border-gray-100 dark:border-[#2E3B55]">
                {(["ALL", "SALES", "SERVICE", "STOCK", "SUMMARY"] as const).map((tab) => {
                    const unreadCount = tab === 'ALL'
                        ? notifications.filter(n => !n.isRead).length
                        : notifications.filter(n => n.type === tab && !n.isRead).length;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                activeTab === tab
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-gray-100 dark:bg-[#1E293B] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                        >
                            {tab === 'ALL' ? 'All Alerts' : tab}
                            {unreadCount > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                    activeTab === tab ? "bg-white text-blue-600" : "bg-blue-600 text-white"
                                }`}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Notification List */}
            {filteredNotifications.length === 0 ? (
                <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#1E293B] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Inbox className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">You're all caught up</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                        No recent notifications for the selected category. Check back later!
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {sections.map((section) => (
                        <div key={section.title} className="space-y-2">
                            <h2 className="text-sm font-black text-gray-900 dark:text-gray-200 uppercase tracking-wide px-1 pt-2">
                                {section.title}
                            </h2>

                            {/* Section Items */}
                            <div className="space-y-2">
                                {section.title === "Unread & Featured" && featuredList.length > 0 && (
                                    <div className="flex items-center gap-3.5 py-3 px-4 rounded-2xl bg-gray-50 dark:bg-[#15161E] border border-gray-100 dark:border-[#2E3B55] mb-2">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Unread Alert Stream</p>
                                            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline" onClick={() => navigate('/service')}>
                                                View recent service orders & updates
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {section.notifications.map((notif) => {
                                    const timeAgo = getRelativeTimeString(notif.createdAt, notif.time);

                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`group flex items-center gap-3.5 py-3.5 px-4 rounded-2xl border transition-all cursor-pointer relative ${
                                                !notif.isRead
                                                    ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 hover:bg-blue-50/80 dark:hover:bg-blue-950/50"
                                                    : "bg-white dark:bg-[#15161E] border-gray-100 dark:border-[#2E3B55] hover:bg-gray-50 dark:hover:bg-[#1E293B]"
                                            }`}
                                        >
                                            {/* Avatar Icon */}
                                            <div className="relative shrink-0">
                                                <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-200 font-bold text-sm shadow-xs">
                                                    {getIcon(notif.type)}
                                                </div>
                                                {!notif.isRead && (
                                                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-600 rounded-full ring-2 ring-white dark:ring-[#15161E]" />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug">
                                                    <span className="font-bold mr-1.5">{notif.title}</span>
                                                    <span className={`${!notif.isRead ? "font-semibold text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"}`}>
                                                        {notif.message}
                                                    </span>
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                        notif.type === 'SALES' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40' :
                                                        notif.type === 'STOCK' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40' :
                                                        notif.type === 'SERVICE' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40' :
                                                        'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40'
                                                    }`}>
                                                        {notif.type}
                                                    </span>
                                                    <span className="text-gray-400 dark:text-gray-500 text-[11px] font-medium">
                                                        {timeAgo}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right Action / Mark Read checkmark */}
                                            <div className="shrink-0 flex items-center gap-2">
                                                {!notif.isRead ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(notif.id);
                                                        }}
                                                        className="p-1.5 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full shadow-xs transition-all"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    </button>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400">
                                                        {getIcon(notif.type)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


