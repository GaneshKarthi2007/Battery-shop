import { createContext, useContext, useState, ReactNode } from "react";
import { UserRole } from "./AuthContext";

export type NotificationType = "SALES" | "STOCK" | "SERVICE" | "SUMMARY";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    time: string;
    isRead: boolean;
    role: UserRole;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, "id" | "isRead" | "time">) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: "1",
            type: "SALES",
            title: "New Sale: ₹12,500",
            message: "2x Exide FEP0-EPIQ65 batteries sold.",
            time: "2 mins ago",
            isRead: false,
            role: "admin",
        },
        {
            id: "2",
            type: "STOCK",
            title: "Low Stock Alert: Okaya XL-5000T",
            message: "Only 4 units remaining in inventory.",
            time: "1 hour ago",
            isRead: false,
            role: "admin",
        },
        {
            id: "3",
            type: "SERVICE",
            title: "New Service Assigned",
            message: "Battery charging for Rajesh Kumar assigned by Admin.",
            time: "30 mins ago",
            isRead: false,
            role: "staff",
        },
        {
            id: "4",
            type: "SERVICE",
            title: "Service Completed",
            message: "Service #3 (Amit Patel) marked as completed by Staff.",
            time: "2 hours ago",
            isRead: true,
            role: "admin",
        },
        {
            id: "5",
            type: "SUMMARY",
            title: "Daily Sales Summary",
            message: "Total Sales today: ₹48,200. Most sold: Exide FEP0 (4 units).",
            time: "Yesterday",
            isRead: true,
            role: "admin",
        }
    ]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const addNotification = (n: Omit<Notification, "id" | "isRead" | "time">) => {
        const newNotification: Notification = {
            ...n,
            id: Math.random().toString(36).substr(2, 9),
            isRead: false,
            time: "Just now",
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearAll
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
