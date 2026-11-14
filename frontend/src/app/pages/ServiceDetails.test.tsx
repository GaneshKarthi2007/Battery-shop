import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { ServiceDetails } from "./ServiceDetails";
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
        put: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
    BASE_URL: "http://localhost:8000/api",
}));

let mockUser = { id: 2, name: "Staff User", role: "staff" };

vi.mock("../contexts/AuthContext", () => ({
    useAuth: () => ({
        user: mockUser,
    }),
}));

vi.mock("../contexts/NotificationContext", () => ({
    useNotifications: () => ({
        addNotification: vi.fn(),
    }),
}));

vi.mock("../contexts/DeveloperContext", () => ({
    useServiceLogIdPrefix: () => "SRV-",
    formatServiceLogId: (_prefix: string, id: string | number) => `SRV-${id}`,
}));

const mockServiceData = {
    id: 1,
    service_code: "1",
    log_id: "1",
    customer_code: "CUST-00001",
    customer_name: "Rajesh Kumar",
    contact_number: "9876543210",
    vehicle_details: "Toyota Fortuner",
    status: "In Progress" as const,
    service_charge: 0,
    complaint_type: "Dead Battery",
    complaint_details: "Battery not cranking the engine",
    battery_brand: "Exide",
    battery_model: "Matrix Red",
    battery_capacity: "65Ah",
    assigned_to: 2,
    created_at: "2026-09-19T10:00:00.000Z",
};

describe("ServiceDetails Page Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUser = { id: 2, name: "Staff User", role: "staff" };
        (apiClient.get as any).mockResolvedValue(mockServiceData);
    });

    it("renders staff single-page view: replaces stat grids with customer details, hides vehicle details and timeline", async () => {
        render(
            <MemoryRouter initialEntries={["/service/1"]}>
                <Routes>
                    <Route path="/service/:id" element={<ServiceDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Service #SRV-1")).toBeInTheDocument();
        });

        // Customer details are rendered in header
        expect(screen.getByText("Rajesh Kumar")).toBeInTheDocument();
        expect(screen.getByText("CUST-00001")).toBeInTheDocument();
        expect(screen.getByText("9876543210")).toBeInTheDocument();

        // Top stat grids are removed for staff
        expect(screen.queryByText("ASSIGNED TO")).not.toBeInTheDocument();

        // Vehicle info is removed for staff
        expect(screen.queryByText("Toyota Fortuner")).not.toBeInTheDocument();

        // Service timeline is hidden for staff
        expect(screen.queryByText("Service Timeline")).not.toBeInTheDocument();

        // Issue summary is displayed compactly
        expect(screen.getByText("Dead Battery")).toBeInTheDocument();
        expect(screen.getByText(/Battery not cranking the engine/i)).toBeInTheDocument();

        // Staff Toolbox is present
        expect(screen.getByText("Staff Toolbox")).toBeInTheDocument();
        expect(screen.getByText("Update Status & Payment")).toBeInTheDocument();
    });

    it("allows staff to input service charge, select Cash or UPI, and complete the service", async () => {
        (apiClient.put as any).mockResolvedValue({
            ...mockServiceData,
            status: "Completed",
            service_charge: 350,
            payment_method: "UPI",
            payment_status: "verified",
        });

        render(
            <MemoryRouter initialEntries={["/service/1"]}>
                <Routes>
                    <Route path="/service/:id" element={<ServiceDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Service #SRV-1")).toBeInTheDocument();
        });

        // Enter service charge
        const chargeInput = screen.getByLabelText("Service Charge Amount");
        fireEvent.change(chargeInput, { target: { value: "350" } });

        // Select UPI
        const upiButton = screen.getByRole("button", { name: /UPI/i });
        fireEvent.click(upiButton);

        // Click Complete Task
        const completeBtn = screen.getByRole("button", { name: /Complete Task & Record Payment/i });
        fireEvent.click(completeBtn);

        await waitFor(() => {
            expect(apiClient.put).toHaveBeenCalledWith("/services/1", {
                status: "Completed",
                service_charge: 350,
                payment_method: "UPI",
                payment_status: "verified",
            });
        });

        // Verifies completed state view
        await waitFor(() => {
            expect(screen.getByText("Task Completed Successfully")).toBeInTheDocument();
            expect(screen.getByText("UPI")).toBeInTheDocument();
        });
    });

    it("renders admin layout with Service Timeline when logged in as admin", async () => {
        mockUser = { id: 1, name: "Admin User", role: "admin" };

        render(
            <MemoryRouter initialEntries={["/service/1"]}>
                <Routes>
                    <Route path="/service/:id" element={<ServiceDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Service #SRV-1")).toBeInTheDocument();
        });

        // Admin sees timeline
        expect(screen.getByText("Service Timeline")).toBeInTheDocument();
        expect(screen.getByText("Customer & Vehicle Information")).toBeInTheDocument();
    });
});
