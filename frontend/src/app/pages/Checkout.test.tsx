import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { Checkout } from "./Checkout";
import { apiClient } from "../api/client";

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

vi.mock("../contexts/NotificationContext", () => ({
    useNotifications: () => ({
        addNotification: vi.fn(),
    }),
}));

describe("Checkout Compact Unified Layout & New Connection Autofill", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (apiClient.get as any).mockResolvedValue([]);
    });

    it("renders single compact card with Name, Mobile Number, Address, Ordered Items, Installation Required checkbox, and GST checkbox without Usage Selection", async () => {
        render(
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: "/checkout",
                        state: {
                            items: [
                                {
                                    id: 10,
                                    name: "Exide",
                                    model: "InvaTubular IT500",
                                    price: 12000,
                                    quantity: 1,
                                    warranty: "60 Months",
                                    type: "Product",
                                    originalData: { id: 10, brand: "Exide", model: "InvaTubular IT500", ah: "150", type: "Inverter", price: 12000, stock: 5 },
                                },
                            ],
                            subtotal: 12000,
                            gst: 2160,
                            total: 14160,
                            fromService: true,
                            isNewConnection: true,
                            serviceId: 5,
                            customerInfo: {
                                name: "Karthik Nair",
                                phone: "9876543299",
                                address: "12 MG Road, Thoothukudi",
                            },
                            serviceSpecs: {
                                complaint_type: "New Connection",
                                vehicle_details: "N/A",
                            },
                        },
                    },
                ]}
            >
                <Routes>
                    <Route path="/checkout" element={<Checkout />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByTestId("checkout-unified-card")).toBeInTheDocument();
            expect(screen.getByDisplayValue("Karthik Nair")).toBeInTheDocument();
            expect(screen.getByDisplayValue("+91 9876543299")).toBeInTheDocument();
            expect(screen.getByDisplayValue("12 MG Road, Thoothukudi")).toBeInTheDocument();
        });

        // No Usage Selection UI
        expect(screen.queryByText(/Usage Selection/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Vehicle Usage/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Home \/ UPS Usage/i)).not.toBeInTheDocument();

        // Ordered items details
        expect(screen.getByText(/Exide InvaTubular IT500/i)).toBeInTheDocument();

        // Installation Required checkbox (auto-checked for New Connection)
        const installCheckbox = screen.getByRole("checkbox", { name: /Installation Required/i }) as HTMLInputElement;
        expect(installCheckbox).toBeInTheDocument();
        expect(installCheckbox.checked).toBe(true);

        // GST / Non-GST checkbox toggles GST calculation
        const gstCheckbox = screen.getByRole("checkbox", { name: /GST Invoice/i }) as HTMLInputElement;
        expect(gstCheckbox.checked).toBe(true);
        expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("₹14,160");

        fireEvent.click(gstCheckbox);
        expect(gstCheckbox.checked).toBe(false);
        expect(screen.getByText("(Non-GST)")).toBeInTheDocument();
        expect(screen.getByTestId("checkout-grand-total")).toHaveTextContent("₹12,000");

        // Clicking back button opens minimalistic confirmation dialog
        fireEvent.click(screen.getByLabelText("Go back"));
        expect(screen.getByTestId("minimal-confirm-dialog")).toBeInTheDocument();
        expect(screen.getByText("Leave Checkout?")).toBeInTheDocument();
    });
});
