import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import { UserManagement } from "./UserManagement";
import { apiClient } from "../api/client";

vi.mock("../api/client", () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
    BASE_URL: "http://localhost:8000/api",
}));

const mockUsers = [
    { id: 1, name: "Dev User", email: "dev@example.com", role: "developer" },
    { id: 2, name: "Admin User", email: "admin@example.com", role: "admin" },
    { id: 3, name: "Staff User", email: "staff@example.com", role: "staff" },
];

describe("UserManagement Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (apiClient.get as any).mockResolvedValue(mockUsers);
    });

    it("renders page header and lists existing users with roles", async () => {
        render(
            <BrowserRouter>
                <UserManagement />
            </BrowserRouter>
        );

        expect(screen.getByText("User Management")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Dev User")).toBeInTheDocument();
            expect(screen.getByText("Admin User")).toBeInTheDocument();
            expect(screen.getByText("Staff User")).toBeInTheDocument();
        });
    });

    it("validates missing fields on user submission", async () => {
        render(
            <BrowserRouter>
                <UserManagement />
            </BrowserRouter>
        );

        const submitBtn = screen.getByRole("button", { name: /create new user/i });
        await act(async () => {
            fireEvent.click(submitBtn);
        });

        expect(screen.getByText("All fields are required.")).toBeInTheDocument();
        expect(apiClient.post).not.toHaveBeenCalled();
    });

    it("creates a new developer user successfully", async () => {
        (apiClient.post as any).mockResolvedValue({
            id: 4,
            name: "New Dev",
            email: "newdev@example.com",
            role: "developer",
        });

        render(
            <BrowserRouter>
                <UserManagement />
            </BrowserRouter>
        );

        const nameInput = screen.getByLabelText("Full Name");
        const emailInput = screen.getByLabelText("Email Address");
        const passwordInput = screen.getByLabelText("Password");
        const roleSelect = screen.getByLabelText("System Role");
        const submitBtn = screen.getByRole("button", { name: /create new user/i });

        fireEvent.change(nameInput, { target: { value: "New Dev" } });
        fireEvent.change(emailInput, { target: { value: "newdev@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "secret123" } });
        fireEvent.change(roleSelect, { target: { value: "developer" } });

        await act(async () => {
            fireEvent.click(submitBtn);
        });

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith("/users", {
                name: "New Dev",
                email: "newdev@example.com",
                password: "secret123",
                role: "developer",
            });
            expect(screen.getByText("User created successfully!")).toBeInTheDocument();
        });
    });

    it("deletes user when delete button is clicked and confirmed", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        (apiClient.delete as any).mockResolvedValue({ message: "User deleted successfully." });

        render(
            <BrowserRouter>
                <UserManagement />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Dev User")).toBeInTheDocument();
        });

        const deleteBtn = screen.getByRole("button", { name: "Delete user Dev User" });

        await act(async () => {
            fireEvent.click(deleteBtn);
        });

        await waitFor(() => {
            expect(apiClient.delete).toHaveBeenCalledWith("/users/1");
        });
    });
});
