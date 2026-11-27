import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";
import { Notifications } from "./Notifications";

const mockNavigate = vi.fn();
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockClearAll = vi.fn();

vi.mock("react-router", async () => {
    const actual = await vi.importActual("react-router");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("../contexts/AuthContext", () => ({
    useAuth: () => ({
        user: { id: 1, name: "Admin User", role: "admin" },
    }),
}));

vi.mock("../components/PushNotificationManager", () => ({
    PushNotificationManager: () => <div data-testid="push-manager-mock" />,
}));

vi.mock("../contexts/NotificationContext", () => ({
    useNotifications: () => ({
        notifications: [
            {
                id: "1",
                type: "SERVICE",
                title: "Job Picked Up",
                message: "Staff Ravi accepted Service #12 (Ganesh).",
                time: "10:00 AM",
                createdAt: new Date().toISOString(),
                isRead: false,
                role: "admin",
            },
            {
                id: "2",
                type: "SALES",
                title: "Staff Billed Product",
                message: "Staff Ravi billed ₹12000 for Ganesh (Service #12).",
                time: "9:00 AM",
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                isRead: true,
                role: "admin",
            },
        ],
        unreadCount: 1,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        clearAll: mockClearAll,
    }),
}));

describe("Notifications Instagram-style Feed", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders New/Today sections cleanly without clutter banners and supports Mark read / Clear / click navigation", () => {
        render(
            <MemoryRouter>
                <Notifications />
            </MemoryRouter>
        );

        expect(screen.getByTestId("instagram-notification-feed")).toBeInTheDocument();
        expect(screen.queryByText("Unread Alert Stream")).not.toBeInTheDocument();
        expect(screen.getByText("New")).toBeInTheDocument();
        expect(screen.getByText("Today")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Job Picked Up"));
        expect(mockMarkAsRead).toHaveBeenCalledWith("1");
        expect(mockNavigate).toHaveBeenCalledWith("/service/12");

        fireEvent.click(screen.getByRole("button", { name: /Mark read/i }));
        expect(mockMarkAllAsRead).toHaveBeenCalled();

        fireEvent.click(screen.getByLabelText("Clear all notifications"));
        expect(mockClearAll).toHaveBeenCalled();
    });
});
