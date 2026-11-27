import { useState } from "react";
import { useNavigate } from "react-router";
import { useNotifications, NotificationType } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import { Bell, ShoppingBag, Package, Wrench, FileText, Inbox, ArrowLeft, Trash2, Sliders } from "lucide-react";
import { PushNotificationManager } from "../components/PushNotificationManager";

function getRelativeTimeString(createdAt: string, timeFallback: string): string {
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return timeFallback || "now";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${diffWeeks}w`;
}

export function Notifications() {
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"ALL" | "SALES" | "SERVICE" | "STOCK" | "SUMMARY">("ALL");

    if (!user) return null;

    const filteredNotifications = activeTab === "ALL"
        ? notifications
        : notifications.filter(n => n.type === activeTab);

    // Instagram-style time grouping: New (unread), Today, This Week, Earlier
    const now = new Date().getTime();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

    const newList = filteredNotifications.filter(n => !n.isRead);
    const readList = filteredNotifications.filter(n => n.isRead);

    const todayList = readList.filter(n => {
        const time = new Date(n.createdAt).getTime();
        if (isNaN(time)) return true;
        return (now - time) <= ONE_DAY_MS;
    });

    const weekList = readList.filter(n => {
        const time = new Date(n.createdAt).getTime();
        if (isNaN(time)) return false;
        const diff = now - time;
        return diff > ONE_DAY_MS && diff <= SEVEN_DAYS_MS;
    });

    const earlierList = readList.filter(n => {
        const time = new Date(n.createdAt).getTime();
        if (isNaN(time)) return false;
        return (now - time) > SEVEN_DAYS_MS;
    });

    const sections = [
        { title: "New", items: newList },
        { title: "Today", items: todayList },
        { title: "This Week", items: weekList },
        { title: "Earlier", items: earlierList },
    ].filter(s => s.items.length > 0);

    const getAvatarStyle = (type: NotificationType) => {
        switch (type) {
            case "SALES":
                return {
                    bg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
                    icon: <ShoppingBag className="w-5 h-5" />,
                };
            case "STOCK":
                return {
                    bg: "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
                    icon: <Package className="w-5 h-5" />,
                };
            case "SERVICE":
                return {
                    bg: "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
                    icon: <Wrench className="w-5 h-5" />,
                };
            case "SUMMARY":
                return {
                    bg: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400",
                    icon: <FileText className="w-5 h-5" />,
                };
            default:
                return {
                    bg: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                    icon: <Bell className="w-5 h-5" />,
                };
        }
    };

    const handleNotificationClick = (notif: typeof notifications[0]) => {
        markAsRead(notif.id);
        if (notif.type === "SERVICE") {
            const match = notif.message.match(/Service #(\d+)/i);
            if (match && match[1]) {
                navigate(`/service/${match[1]}`);
            } else {
                navigate(user.role === "staff" ? "/available-jobs" : "/service");
            }
        } else if (notif.type === "SALES") {
            navigate(user.role === "staff" ? "/assigned-jobs" : "/sales");
        }
    };

    return (
        <div className="max-w-xl mx-auto pb-24 bg-white dark:bg-[#0D1B2A] text-gray-900 dark:text-gray-100 min-h-screen sm:rounded-2xl sm:border sm:border-gray-200 dark:sm:border-[#2E3B55] overflow-hidden">
            {/* Minimal Sticky Instagram-style Header */}
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#0D1B2A]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-[#2E3B55]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 -ml-1.5 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-full transition-colors"
                        title="Go Back"
                        aria-label="Go Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                        Notifications
                    </h1>
                </div>

                <div className="flex items-center gap-1.5">
                    {filteredNotifications.some(n => !n.isRead) && (
                        <button
                            onClick={markAllAsRead}
                            className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                            Mark read
                        </button>
                    )}
                    {filteredNotifications.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors"
                            title="Clear all notifications"
                            aria-label="Clear all notifications"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    {(user.role === "admin" || user.role === "developer") && (
                        <button
                            onClick={() => navigate("/notification-management")}
                            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-full transition-colors"
                            title="Notification Settings"
                            aria-label="Notification Settings"
                        >
                            <Sliders className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 scrollbar-hide border-b border-gray-100 dark:border-[#2E3B55]">
                {(["ALL", "SERVICE", "SALES", "STOCK", "SUMMARY"] as const).map((tab) => {
                    const unread = tab === "ALL"
                        ? notifications.filter(n => !n.isRead).length
                        : notifications.filter(n => n.type === tab && !n.isRead).length;

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                activeTab === tab
                                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                                    : "bg-gray-100 dark:bg-[#161D30] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                            }`}
                        >
                            <span>{tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
                            {unread > 0 && (
                                <span className={`px-1.5 rounded-full text-[10px] font-black ${
                                    activeTab === tab ? "bg-blue-500 text-white" : "bg-blue-600 text-white"
                                }`}>
                                    {unread}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Compact Push Toggle */}
            <div className="px-4 pt-2.5">
                <PushNotificationManager className="mb-1" />
            </div>

            {/* Instagram-style Activity Feed */}
            {filteredNotifications.length === 0 ? (
                <div className="py-20 text-center px-6">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-[#161D30] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Inbox className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">No notifications yet</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Updates from jobs and staff activity will appear here.
                    </p>
                </div>
            ) : (
                <div data-testid="instagram-notification-feed" className="divide-y divide-gray-100 dark:divide-[#1E293B]">
                    {sections.map((section) => (
                        <div key={section.title} className="py-2">
                            <h2 className="text-xs font-black text-gray-900 dark:text-gray-200 px-4 py-1.5">
                                {section.title}
                            </h2>

                            <div>
                                {section.items.map((notif) => {
                                    const timeAgo = getRelativeTimeString(notif.createdAt, notif.time);
                                    const avatar = getAvatarStyle(notif.type);

                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors ${
                                                !notif.isRead
                                                    ? "bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30"
                                                    : "hover:bg-gray-50 dark:hover:bg-[#161D30]"
                                            }`}
                                        >
                                            {/* Circular Instagram-like Avatar */}
                                            <div className="relative shrink-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${avatar.bg}`}>
                                                    {avatar.icon}
                                                </div>
                                                {!notif.isRead && (
                                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white dark:ring-[#0D1B2A]" />
                                                )}
                                            </div>

                                            {/* Inline activity copy + relative time */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 leading-snug">
                                                    <span className="font-bold mr-1">{notif.title}</span>
                                                    <span className={!notif.isRead ? "text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"}>
                                                        {notif.message}
                                                    </span>
                                                    <span className="text-gray-400 dark:text-gray-500 text-xs font-medium ml-1.5 whitespace-nowrap">
                                                        {timeAgo}
                                                    </span>
                                                </p>
                                            </div>

                                            {/* Right action pill */}
                                            {!notif.isRead && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notif.id);
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold shrink-0 transition-colors"
                                                >
                                                    Seen
                                                </button>
                                            )}
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
