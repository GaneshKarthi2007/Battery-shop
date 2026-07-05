import { useState } from "react";
import { useNavigate } from "react-router";
import { useNotifications, NotificationType } from "../contexts/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import { Bell, ShoppingBag, Package, Wrench, FileText, Check, Inbox, ArrowLeft } from "lucide-react";
import { Button } from "../components/Button";

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
            case "SALES": return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
            case "STOCK": return <Package className="w-5 h-5 text-amber-500" />;
            case "SERVICE": return <Wrench className="w-5 h-5 text-sky-500" />;
            case "SUMMARY": return <FileText className="w-5 h-5 text-indigo-500" />;
            default: return <Bell className="w-5 h-5 text-slate-500" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white hover:bg-gray-100 dark:bg-[#1B263B] dark:hover:bg-[#2E3B55] border border-gray-200 dark:border-[#2E3B55] text-gray-700 dark:text-gray-300 rounded-xl transition-all shadow-sm active:scale-95"
                        title="Go Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Notifications Log</h1>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Track and manage recent activity alerts</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                    {filteredNotifications.some(n => !n.isRead) && (
                        <Button
                            onClick={markAllAsRead}
                            variant="outline"
                            size="sm"
                            className="text-xs font-bold uppercase tracking-wider"
                        >
                            Mark All as Read
                        </Button>
                    )}
                    <Button
                        onClick={clearAll}
                        variant="danger"
                        size="sm"
                        className="text-xs font-bold uppercase tracking-wider"
                    >
                        Clear All
                    </Button>
                </div>
            </div>

            {/* Main Container Card */}
            <div className="bg-white dark:bg-[#1B263B] border border-gray-150 dark:border-[#2E3B55] rounded-[2rem] overflow-hidden shadow-sm">
                
                {/* Horizontal Category Filtering */}
                <div className="px-6 py-4 border-b border-gray-150 dark:border-[#2E3B55] flex gap-2.5 overflow-x-auto scrollbar-hide bg-gray-50/50 dark:bg-black/10">
                    {(["ALL", "SALES", "SERVICE", "STOCK", "SUMMARY"] as const).map((tab) => {
                        const count = tab === 'ALL'
                            ? notifications.filter(n => !n.isRead).length
                            : notifications.filter(n => n.type === tab && !n.isRead).length;

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                                    activeTab === tab
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 border-transparent"
                                        : "bg-gray-100 dark:bg-[#0D1B2A] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-white/5"
                                }`}
                            >
                                {tab === 'ALL' ? 'All Alerts' : tab.toLowerCase()}
                                {count > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter ${
                                        activeTab === tab 
                                            ? 'bg-white text-blue-600' 
                                            : 'bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.4)] animate-pulse'
                                    }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* List View Container */}
                <div className="p-6">
                    {filteredNotifications.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="mb-4 flex justify-center relative">
                                <div className="absolute inset-0 w-16 h-16 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-2xl mx-auto opacity-50 animate-pulse" />
                                <Inbox className="w-12 h-12 text-gray-300 dark:text-gray-700 relative z-10" />
                            </div>
                            <h3 className="text-base font-bold text-gray-600 dark:text-gray-300">All alerts inspected</h3>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">There are no notifications matching the selected tab filter.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {sections.map((section) => (
                                <div key={section.title} className="space-y-3">
                                    <h4 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.25em] px-1">
                                        {section.title}
                                    </h4>
                                    <div className="space-y-2">
                                        {section.notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                onClick={() => {
                                                    markAsRead(notif.id);
                                                    
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
                                                className={`w-full p-4 rounded-2xl text-left transition-all duration-300 flex gap-4 group relative cursor-pointer border border-transparent ${
                                                    !notif.isRead
                                                        ? "bg-blue-50/20 dark:bg-blue-950/10 border-blue-500/10 dark:border-blue-500/5 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                                                        : "hover:bg-gray-50 dark:hover:bg-white/5 border-gray-100 dark:border-white/0"
                                                }`}
                                            >
                                                {/* Icon panel */}
                                                <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 ${
                                                    notif.type === 'SALES' ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/10 dark:border-emerald-500/5' :
                                                    notif.type === 'STOCK' ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-500/10 dark:border-amber-500/5' :
                                                    notif.type === 'SERVICE' ? 'bg-sky-50 dark:bg-sky-950/30 border border-sky-500/10 dark:border-sky-500/5' : 
                                                    'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-500/10 dark:border-indigo-500/5'
                                                }`}>
                                                    {getIcon(notif.type)}
                                                </div>

                                                {/* Details text */}
                                                <div className="flex-1 min-w-0 pr-8">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <h3 className={`text-sm font-bold leading-snug tracking-tight ${
                                                            !notif.isRead ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                                                        }`}>
                                                            {notif.title}
                                                        </h3>
                                                        {!notif.isRead && (
                                                            <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                                                        )}
                                                    </div>
                                                    <p className={`text-xs leading-relaxed mb-2.5 ${
                                                        !notif.isRead ? "text-slate-650 dark:text-slate-300 font-medium" : "text-slate-450 dark:text-slate-500 font-normal"
                                                    }`}>
                                                        {notif.message}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                            {notif.time}
                                                        </span>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                                                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                                                            notif.type === 'SALES' ? 'text-emerald-600 dark:text-emerald-400' :
                                                            notif.type === 'STOCK' ? 'text-amber-600 dark:text-amber-400' :
                                                            notif.type === 'SERVICE' ? 'text-sky-600 dark:text-sky-400' : 
                                                            'text-indigo-600 dark:text-indigo-400'
                                                        }`}>
                                                            {notif.type}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Float Hover mark read button */}
                                                {!notif.isRead && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(notif.id);
                                                        }}
                                                        className="absolute right-4 bottom-4 p-1.5 bg-white hover:bg-blue-100 dark:bg-gray-800 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl shadow-sm border border-gray-150 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
