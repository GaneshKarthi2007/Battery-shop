import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, ArrowLeft, Sliders, Volume2, Smartphone, CheckCircle, Trash2, Send, Zap, Info } from "lucide-react";
import { PushNotificationManager } from "../components/PushNotificationManager";
import { useNotifications } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";

export function NotificationManagement() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notifications, markAllAsRead, clearAll } = useNotifications();

    // Local preferences state (persisted to localStorage)
    const [prefs, setPrefs] = useState(() => {
        const saved = localStorage.getItem("smr_notification_prefs");
        return saved ? JSON.parse(saved) : {
            servicePush: true,
            salesPush: true,
            stockAlerts: true,
            dailySummary: false,
            soundEnabled: true,
            vibrationEnabled: true,
        };
    });

    const [testStatus, setTestStatus] = useState<string | null>(null);

    const togglePref = (key: keyof typeof prefs) => {
        const updated = { ...prefs, [key]: !prefs[key] };
        setPrefs(updated);
        localStorage.setItem("smr_notification_prefs", JSON.stringify(updated));
    };

    const handleSendTestNotification = () => {
        if (!("Notification" in window)) {
            setTestStatus("Notifications are not supported in this browser.");
            return;
        }

        if (Notification.permission === "granted") {
            new Notification("SMR Battery Shop Test Alert 🔔", {
                body: "Notification system is working properly!",
                icon: "/logo.png",
            });
            setTestStatus("Test notification sent successfully!");
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    new Notification("SMR Battery Shop Test Alert 🔔", {
                        body: "Notification system is working properly!",
                        icon: "/logo.png",
                    });
                    setTestStatus("Test notification sent successfully!");
                } else {
                    setTestStatus("Notification permission was denied.");
                }
            });
        } else {
            setTestStatus("Notification permission is currently blocked in browser settings.");
        }

        setTimeout(() => setTestStatus(null), 4000);
    };

    if (!user) return null;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6 pt-2 bg-white dark:bg-[#0D1B2A] text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#0D1B2A]/90 backdrop-blur-md py-3 mb-6 flex items-center justify-between border-b border-gray-100 dark:border-[#2E3B55]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-full transition-colors active:scale-95"
                        title="Go Back"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight uppercase">Notification Management</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Configure push alerts, device preferences & test notifications</p>
                    </div>
                </div>

                <button
                    onClick={() => navigate("/notifications")}
                    className="px-3.5 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[#1E293B] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors flex items-center gap-1.5"
                >
                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    View Logs
                </button>
            </div>

            {/* Main PWA Push Subscription Manager */}
            <div className="mb-6">
                <PushNotificationManager />
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-gray-50 dark:bg-[#15161E] border border-gray-200/80 dark:border-[#2E3B55] rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                        {unreadCount}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Unread Notifications</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total stored: {notifications.length} alerts</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors flex items-center gap-1"
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Mark All Read
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-xl transition-colors flex items-center gap-1"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear Log
                        </button>
                    )}
                </div>
            </div>

            {/* Notification Preference Sections */}
            <div className="space-y-6">
                {/* Section 1: Alert Subscriptions */}
                <div className="border border-gray-200/80 dark:border-[#2E3B55] rounded-2xl p-5 bg-white dark:bg-[#15161E] shadow-xs">
                    <div className="flex items-center gap-2 mb-4">
                        <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Alert Preferences</h2>
                    </div>

                    <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-800">
                        <div className="pt-2 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Service Task Push Notifications</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Receive alerts when staff jobs are created or assigned</p>
                            </div>
                            <button
                                onClick={() => togglePref("servicePush")}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                                    prefs.servicePush ? "bg-blue-600 justify-end" : "bg-gray-300 dark:bg-gray-700 justify-start"
                                }`}
                            >
                                <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                            </button>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Sales & Billing Alerts</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Instant notification when a new sale or invoice is generated</p>
                            </div>
                            <button
                                onClick={() => togglePref("salesPush")}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                                    prefs.salesPush ? "bg-blue-600 justify-end" : "bg-gray-300 dark:bg-gray-700 justify-start"
                                }`}
                            >
                                <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                            </button>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Low Stock Warnings</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Notify admin when battery stock drops below threshold</p>
                            </div>
                            <button
                                onClick={() => togglePref("stockAlerts")}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                                    prefs.stockAlerts ? "bg-blue-600 justify-end" : "bg-gray-300 dark:bg-gray-700 justify-start"
                                }`}
                            >
                                <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                            </button>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Daily Summary Report Push</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Receive end-of-day shop summary push notification</p>
                            </div>
                            <button
                                onClick={() => togglePref("dailySummary")}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                                    prefs.dailySummary ? "bg-blue-600 justify-end" : "bg-gray-300 dark:bg-gray-700 justify-start"
                                }`}
                            >
                                <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section 2: Sound & Device Feedback */}
                <div className="border border-gray-200/80 dark:border-[#2E3B55] rounded-2xl p-5 bg-white dark:bg-[#15161E] shadow-xs">
                    <div className="flex items-center gap-2 mb-4">
                        <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Device Feedback Settings</h2>
                    </div>

                    <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-800">
                        <div className="pt-2 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">In-App Notification Sound</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Play chime when new notification arrives</p>
                                </div>
                            </div>
                            <button
                                onClick={() => togglePref("soundEnabled")}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                                    prefs.soundEnabled ? "bg-blue-600 justify-end" : "bg-gray-300 dark:bg-gray-700 justify-start"
                                }`}
                            >
                                <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                            </button>
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Smartphone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Vibration Feedback</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Vibrate mobile device on high-priority alerts</p>
                                </div>
                            </div>
                            <button
                                onClick={() => togglePref("vibrationEnabled")}
                                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                                    prefs.vibrationEnabled ? "bg-blue-600 justify-end" : "bg-gray-300 dark:bg-gray-700 justify-start"
                                }`}
                            >
                                <span className="w-4 h-4 bg-white rounded-full shadow-xs" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Section 3: Test Notification Tool */}
                <div className="border border-gray-200/80 dark:border-[#2E3B55] rounded-2xl p-5 bg-white dark:bg-[#15161E] shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-5 h-5 text-amber-500" />
                        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Test Notification System</h2>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Send a test browser notification to confirm your browser and device permissions are properly set up.
                    </p>

                    <button
                        onClick={handleSendTestNotification}
                        className="px-4 py-2.5 bg-gray-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                    >
                        <Send className="w-4 h-4" />
                        Send Test Notification
                    </button>

                    {testStatus && (
                        <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            {testStatus}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

