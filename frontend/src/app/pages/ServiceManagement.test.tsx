import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import { ServiceManagement } from "./ServiceManagement";
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
        delete: vi.fn(),
    },
    BASE_URL: "http://localhost:8000/api",
}));

vi.mock("../contexts/AuthContext", () => ({
    useAuth: () => ({
        user: { id: 1, name: "Admin", role: "admin" },
    }),
}));

const mockServices = [
    {
        id: 101,
        customer_name: "Rajesh Kumar",
        contact_number: "9876543210",
        vehicle_details: "Hyundai i20 (TN 38 AB 1234)",
        status: "Pending",
        service_charge: 450,
        battery_brand: "Exide",
        battery_model: "Matrix Red",
        created_at: "2026-03-15T10:00:00.000Z",
    },
];

describe("ServiceManagement Component Minimal View", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (apiClient.get as any).mockResolvedValue(mockServices);
    });

    it("renders minimal record view by default and does not show Select All button", async () => {
        render(
            <BrowserRouter>
                <ServiceManagement />
            </BrowserRouter>
        );

        expect(screen.getByText("Service Management")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Rajesh Kumar")).toBeInTheDocument();
            expect(screen.getByText("9876543210")).toBeInTheDocument();
            expect(screen.getByText("₹450")).toBeInTheDocument();
        });

        // Verify Select All button is removed
        expect(screen.queryByText("Select All")).not.toBeInTheDocument();
    });

    it("renders minimalized New Request button and navigates when clicked", async () => {
        render(
            <BrowserRouter>
                <ServiceManagement />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Rajesh Kumar")).toBeInTheDocument();
        });

        const newReqBtn = screen.getByRole("button", { name: "New Service Request" });
        expect(newReqBtn).toBeInTheDocument();

        await act(async () => {
            fireEvent.click(newReqBtn);
        });
        expect(mockNavigate).toHaveBeenCalledWith("/services/new");
    });

    it("toggles expanded details when right dropdown icon is clicked", async () => {
        render(
            <BrowserRouter>
                <ServiceManagement />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Rajesh Kumar")).toBeInTheDocument();
        });

        // Initially expanded info like "Hyundai i20" is hidden in drawer
        expect(screen.queryByText("Hyundai i20 (TN 38 AB 1234)")).not.toBeInTheDocument();

        const dropdownBtn = screen.getByRole("button", { name: "Toggle details for Rajesh Kumar" });
        await act(async () => {
            fireEvent.click(dropdownBtn);
        });

        await waitFor(() => {
            expect(screen.getByText("Hyundai i20 (TN 38 AB 1234)")).toBeInTheDocument();
            expect(screen.getByText("Open Details")).toBeInTheDocument();
        });
    });

    it("navigates to service details when clicking center of the record card", async () => {
        render(
            <BrowserRouter>
                <ServiceManagement />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Rajesh Kumar")).toBeInTheDocument();
        });

        const recordTitle = screen.getByText("Rajesh Kumar");
        fireEvent.click(recordTitle);

        expect(mockNavigate).toHaveBeenCalledWith("/service/101");
    });
});
