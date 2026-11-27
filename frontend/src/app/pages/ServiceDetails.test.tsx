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
    sub_status: "Battery Testing",
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
    });

    it("hides payment module during In Progress and shows Complete Task & Request New Battery buttons", async () => {
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

        // Payment inputs should NOT be visible during In Progress
        expect(screen.queryByLabelText("Service Charge Amount")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Confirm & Save Payment/i })).not.toBeInTheDocument();

        // Complete Task & Request New Battery buttons are shown instead
        expect(screen.getByRole("button", { name: /Complete Task/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Request New Battery/i })).toBeInTheDocument();
    });

    it("shows payment module after completing task, allowing staff to record charge and Cash/UPI", async () => {
        (apiClient.put as any)
            .mockResolvedValueOnce({
                ...mockServiceData,
                status: "Completed",
            })
            .mockResolvedValueOnce({
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

        // Click Complete Task
        const completeTaskBtn = screen.getByRole("button", { name: /Complete Task/i });
        fireEvent.click(completeTaskBtn);

        await waitFor(() => {
            expect(apiClient.put).toHaveBeenCalledWith("/services/1", { status: "Completed" });
        });

        // Payment module now appears!
        await waitFor(() => {
            expect(screen.getByLabelText("Service Charge Amount")).toBeInTheDocument();
        });

        // Enter service charge
        const chargeInput = screen.getByLabelText("Service Charge Amount");
        fireEvent.change(chargeInput, { target: { value: "350" } });

        // Select UPI
        const upiButton = screen.getByRole("button", { name: /UPI/i });
        fireEvent.click(upiButton);

        // Click Confirm & Save Payment
        const savePaymentBtn = screen.getByRole("button", { name: /Confirm & Save Payment/i });
        fireEvent.click(savePaymentBtn);

        await waitFor(() => {
            expect(apiClient.put).toHaveBeenCalledWith("/services/1", {
                service_charge: 350,
                payment_method: "UPI",
                payment_status: "verified",
            });
        });

        // Verifies completed state summary card
        await waitFor(() => {
            expect(screen.getByText("Task Completed Successfully")).toBeInTheDocument();
            expect(screen.getByText("UPI")).toBeInTheDocument();
        });
    });

    it("handles sub-status dropdown: tick is non-clickable when unchanged, and supports manual entry via Others", async () => {
        (apiClient.put as any).mockResolvedValue({
            ...mockServiceData,
            sub_status: "Custom Stage Test",
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

        const tickBtn = screen.getByLabelText("Confirm Sub-Status");
        // Initially, selected status equals service.sub_status ("Battery Testing"), so tick is disabled
        expect(tickBtn).toBeDisabled();

        const selectDropdown = screen.getByLabelText("Update Sub-Status") as HTMLSelectElement;
        expect(selectDropdown.value).toBe("Battery Testing");

        // Select "Others"
        fireEvent.change(selectDropdown, { target: { value: "Others" } });
        expect(selectDropdown.value).toBe("Others");

        // Custom text input appears; tick remains disabled while empty
        const customInput = screen.getByLabelText("Custom Sub-Status");
        expect(customInput).toBeInTheDocument();
        expect(tickBtn).toBeDisabled();

        // Enter custom text
        fireEvent.change(customInput, { target: { value: "Custom Stage Test" } });
        // Now tick button is clickable
        expect(tickBtn).not.toBeDisabled();

        // Click tick button to apply
        fireEvent.click(tickBtn);

        await waitFor(() => {
            expect(apiClient.put).toHaveBeenCalledWith("/services/1", {
                sub_status: "Custom Stage Test",
                notes: "",
            });
        });

        // The newly entered sub-status is added to the dropdown options and selected
        await waitFor(() => {
            expect(screen.getByRole("option", { name: "Custom Stage Test" })).toBeInTheDocument();
            expect(selectDropdown.value).toBe("Custom Stage Test");
            // Since previous and current now match, tick is non-clickable again
            expect(tickBtn).toBeDisabled();
        });
    });

    it("renders compact admin layout with assigned staff on right, gallery/timeline icons, clickable mobile quick contact, and hides Assign Staff when already assigned", async () => {
        mockUser = { id: 1, name: "Admin User", role: "admin" };
        (apiClient.get as any).mockResolvedValue({
            ...mockServiceData,
            assigned_staff: { id: 2, name: "Staff User" },
            sales: [
                {
                    id: 21,
                    type: "Sale",
                    customer_name: "Rajesh Kumar",
                    total_amount: "6500",
                    payment_method: "UPI",
                    created_at: "2026-11-27T10:00:00.000Z",
                    items: [
                        { id: 1, product_id: 5, quantity: 1, price: "6500", product: { brand: "Exide", model: "Matrix Red", ah: "65Ah", price: 6500 } },
                    ],
                },
            ],
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

        // Assigned staff shown in top card right side, Assign Staff module hidden because already assigned
        expect(screen.getByText("Staff User")).toBeInTheDocument();
        expect(screen.queryByTestId("assign-staff-module")).not.toBeInTheDocument();

        // Compact info card shows needed fields and no separate Quick Contact label
        expect(screen.getByTestId("admin-compact-info")).toBeInTheDocument();
        expect(screen.queryByText(/Quick Contact/i)).not.toBeInTheDocument();
        expect(screen.getByText("Dead Battery")).toBeInTheDocument();
        expect(screen.getByText("Battery not cranking the engine")).toBeInTheDocument();

        // Clicking mobile number reveals Call & WhatsApp quick contact actions
        fireEvent.click(screen.getByRole("button", { name: /9876543210/i }));
        expect(screen.getByTestId("mobile-quick-contact-menu")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /^Call$/i })).toHaveAttribute("href", "tel:+919876543210");
        expect(screen.getByRole("link", { name: /WhatsApp/i })).toHaveAttribute("href", "https://wa.me/919876543210");

        // Linked Products section is visible
        expect(screen.getByTestId("linked-products-card")).toBeInTheDocument();
        expect(screen.getByText(/Exide Matrix Red × 1/i)).toBeInTheDocument();

        // Timeline & Gallery open via icon buttons
        expect(screen.queryByTestId("timeline-modal")).not.toBeInTheDocument();
        fireEvent.click(screen.getByLabelText("Service Timeline"));
        expect(screen.getByTestId("timeline-modal")).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText("Close Service Timeline"));

        fireEvent.click(screen.getByLabelText("Job Site Photos"));
        expect(screen.getByTestId("gallery-modal")).toBeInTheDocument();
    });

    it("hides Convert & Bill for New Connection jobs and shows Assign Staff only when unassigned", async () => {
        mockUser = { id: 1, name: "Admin User", role: "admin" };
        (apiClient.get as any).mockImplementation((url: string) => {
            if (url === "/staff") {
                return Promise.resolve([{ id: 2, name: "Staff User" }]);
            }
            return Promise.resolve({
                ...mockServiceData,
                assigned_to: undefined,
                assigned_staff: undefined,
                complaint_type: "New Connection",
                complaint_details: "",
            });
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

        // Convert & Bill is hidden for New Connection
        expect(screen.queryByRole("button", { name: /Convert & Bill/i })).not.toBeInTheDocument();

        // Assign Staff module IS shown when unassigned
        expect(screen.getByTestId("assign-staff-module")).toBeInTheDocument();

        // Specific complaint details block is hidden when empty
        expect(screen.queryByText(/Specific Complaint Details/i)).not.toBeInTheDocument();
    });

    it("requires product billing first for New Connection before allowing task completion", async () => {
        (apiClient.get as any).mockResolvedValue({
            ...mockServiceData,
            id: 7,
            complaint_type: "New Connection",
            sales: [],
        });

        render(
            <MemoryRouter initialEntries={["/service/7"]}>
                <Routes>
                    <Route path="/service/:id" element={<ServiceDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("New Connection — Product Billing Required")).toBeInTheDocument();
        });

        expect(screen.queryByRole("button", { name: /Complete Task/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Request New Battery/i })).not.toBeInTheDocument();

        const billBtn = screen.getByRole("button", { name: /Bill Product/i });
        fireEvent.click(billBtn);

        expect(mockNavigate).toHaveBeenCalledWith("/sales", {
            state: expect.objectContaining({
                fromService: true,
                isNewConnection: true,
                serviceId: 7,
                customerInfo: {
                    name: "Rajesh Kumar",
                    phone: "9876543210",
                    address: "",
                },
                serviceSpecs: expect.objectContaining({
                    complaint_type: "New Connection",
                }),
            }),
        });
    });

    it("follows the standard service completion and payment process for New Connection after product billing", async () => {
        const billedNewConnection = {
            ...mockServiceData,
            id: 8,
            complaint_type: "New Connection",
            sales: [
                {
                    id: 99,
                    type: "Sale",
                    customer_name: "Rajesh Kumar",
                    total_amount: "5500",
                    payment_method: "Cash",
                    created_at: "2026-11-27T10:00:00.000Z",
                    items: [
                        {
                            id: 1,
                            product_id: 10,
                            quantity: 1,
                            price: "5500",
                            product: { brand: "Exide", model: "InvaTubular", ah: "150Ah", price: 5500 },
                        },
                    ],
                },
            ],
        };
        (apiClient.get as any).mockResolvedValue(billedNewConnection);
        (apiClient.put as any).mockResolvedValue({ ...billedNewConnection, status: "Completed" });

        render(
            <MemoryRouter initialEntries={["/service/8"]}>
                <Routes>
                    <Route path="/service/:id" element={<ServiceDetails />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Billed Product \(1\)/i)).toBeInTheDocument();
            expect(screen.getByText(/Exide InvaTubular × 1/i)).toBeInTheDocument();
        });

        const completeBtn = screen.getByRole("button", { name: /Complete Task/i });
        expect(completeBtn).toBeInTheDocument();
        fireEvent.click(completeBtn);

        await waitFor(() => {
            expect(apiClient.put).toHaveBeenCalledWith("/services/8", { status: "Completed" });
            expect(screen.getByLabelText("Service Charge Amount")).toBeInTheDocument();
        });
    });

    it("shows minimalistic confirmation when staff clicks Back with unsaved notes or sub-status changes", async () => {
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

        const noteInput = screen.getByPlaceholderText(/Add status notes/i);
        fireEvent.change(noteInput, { target: { value: "battery voltage ok" } });
        expect(noteInput).toHaveValue("Battery voltage ok");

        fireEvent.click(screen.getByText("Back to Tasks"));
        expect(screen.getByTestId("minimal-confirm-dialog")).toBeInTheDocument();
        expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: /^Discard$/i }));
        expect(mockNavigate).toHaveBeenCalledWith("/assigned-jobs");
    });
});
