import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiClient } from "../api/client";
import { UserRole } from "./AuthContext";

export type NotificationType = "SALES" | "STOCK" | "SERVICE" | "SUMMARY";

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    time: string;
    createdAt: string; // ISO timestamp for grouping
    isRead: boolean;
    role: UserRole;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, "id" | "isRead" | "time" | "createdAt">) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = async () => {
        try {
            const data = await apiClient.get<Notification[]>('/notifications');
            setNotifications(data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Set up a polling interval for notifications (every 30 seconds)
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const addNotification = async (n: Omit<Notification, "id" | "isRead" | "time" | "createdAt">) => {
        // For now, we usually create notifications on the backend during actions.
        // This local add is for immediate UI feedback if needed, 
        // but it won't persist unless the backend creates it.
        const newNotification: Notification = {
            ...n,
            id: Math.random().toString(36).substr(2, 9),
            isRead: false,
            time: "Just now",
            createdAt: new Date().toISOString(),
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const markAsRead = async (id: string) => {
        try {
            await apiClient.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiClient.post('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
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
