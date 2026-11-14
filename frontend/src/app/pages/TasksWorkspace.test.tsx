import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import { TasksWorkspace } from "./TasksWorkspace";
import { apiClient } from "../api/client";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
    const actual = await vi.importActual("react-router");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("../api/client", () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
    BASE_URL: "http://localhost:8000/api",
}));

vi.mock("../contexts/AuthContext", () => ({
    useAuth: () => ({
        user: { id: 2, name: "Staff Member", role: "staff" },
    }),
}));

vi.mock("../contexts/DeveloperContext", () => ({
    useServiceLogIdPrefix: () => "SRV-",
    formatServiceLogId: (_prefix: string, id: string | number) => `SRV-${id}`,
}));

const mockServices = [
    {
        id: 1,
        service_code: "1",
        log_id: "1",
        customer_name: "Ramesh Sharma",
        contact_number: "9876543210",
        vehicle_details: "Hero Splendor",
        status: "Pending",
        service_charge: 300,
        battery_brand: "Exide",
        battery_model: "12V-5Ah",
        complaint_type: "Not charging",
        complaint_details: "Battery drains quickly",
        created_at: "2026-11-14T06:00:00.000Z",
    },
    {
        id: 2,
        service_code: "2",
        log_id: "2",
        customer_name: "Anita Patel",
        contact_number: "9876543211",
        vehicle_details: "Honda Activa",
        status: "In Progress",
        assigned_to: 2,
        service_charge: 500,
        battery_brand: "Amaron",
        battery_model: "PRO",
        complaint_type: "Dead",
        complaint_details: "Urgent fix required",
        created_at: "2026-11-14T06:10:00.000Z",
    },
    {
        id: 3,
        service_code: "3",
        log_id: "3",
        customer_name: "Suresh Raina",
        contact_number: "9876543212",
        vehicle_details: "Royal Enfield",
        status: "Completed",
        assigned_to: 2,
        service_charge: 400,
        battery_brand: "Exide",
        complaint_type: "Battery Check",
        created_at: "2026-11-14T04:00:00.000Z",
    },
    {
        id: 4,
        service_code: "4",
        log_id: "4",
        customer_name: "Vikas Yadav",
        contact_number: "9876543213",
        vehicle_details: "Pulsar 150",
        status: "Completed",
        assigned_to: 5, // Completed by another staff or previous manual record
        service_charge: 250,
        battery_brand: "Amaron",
        complaint_type: "Water Refill",
        created_at: "2026-11-10T02:00:00.000Z",
    },
];

describe("TasksWorkspace Component (Staff View)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("loads and displays assigned tasks for logged in staff", async () => {
        (apiClient.get as any).mockResolvedValue(mockServices);

        render(
            <BrowserRouter>
                <TasksWorkspace defaultTab="assigned" />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith("/services");
        });

        // Anita Patel is assigned to staff (id: 2)
        await waitFor(() => {
            expect(screen.getAllByText("Anita Patel").length).toBeGreaterThan(0);
        });
    });

    it("displays error message and retry button when task loading fails", async () => {
        (apiClient.get as any).mockRejectedValue(new Error("Network Error"));

        render(
            <BrowserRouter>
                <TasksWorkspace defaultTab="assigned" />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Network Error")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
        });

        // Click retry
        (apiClient.get as any).mockResolvedValue(mockServices);
        fireEvent.click(screen.getByRole("button", { name: /retry/i }));

        await waitFor(() => {
            expect(screen.getAllByText("Anita Patel").length).toBeGreaterThan(0);
        });
    });

    it("displays available tasks when switched to available tab", async () => {
        (apiClient.get as any).mockResolvedValue(mockServices);

        render(
            <BrowserRouter>
                <TasksWorkspace defaultTab="available" />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByText("Ramesh Sharma").length).toBeGreaterThan(0);
        });
    });

    it("removes filter pills below search bar and provides date wise search at right side", async () => {
        (apiClient.get as any).mockResolvedValue(mockServices);

        render(
            <BrowserRouter>
                <TasksWorkspace defaultTab="available" />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getAllByText("Ramesh Sharma").length).toBeGreaterThan(0);
        });

        // Verify filter pills below search bar are removed
        expect(screen.queryByRole("button", { name: /^All$/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /^Urgent$/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /^Oldest$/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /^Newest$/i })).not.toBeInTheDocument();

        // Verify date wise search input exists at the right side of search bar
        const dateInput = screen.getByLabelText("Date Search");
        expect(dateInput).toBeInTheDocument();

        // Filtering by date
        fireEvent.change(dateInput, { target: { value: "2026-11-14" } });
        expect(screen.getAllByText("Ramesh Sharma").length).toBeGreaterThan(0);

        // Filter by non-matching date
        fireEvent.change(dateInput, { target: { value: "2026-11-01" } });
        expect(screen.queryByText("Ramesh Sharma")).not.toBeInTheDocument();
        expect(screen.getByText("No jobs match your search parameters.")).toBeInTheDocument();
    });

    it("displays all previous entries without any filtered in history tab", async () => {
        (apiClient.get as any).mockResolvedValue(mockServices);

        render(
            <BrowserRouter>
                <TasksWorkspace defaultTab="history" />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith("/services");
        });

        // Both completed records are displayed, including Vikas Yadav who was not assigned to user 2
        await waitFor(() => {
            expect(screen.getAllByText("Suresh Raina").length).toBeGreaterThan(0);
            expect(screen.getByText("Vikas Yadav")).toBeInTheDocument();
        });
    });
});
