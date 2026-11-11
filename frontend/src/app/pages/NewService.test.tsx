import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import { NewService } from "./NewService";
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

vi.mock("../contexts/DeveloperContext", () => ({
    useDeveloper: () => ({
        features: { enableContactActions: false, manualLogId: true },
    }),
}));

describe("NewService Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (apiClient.get as any).mockResolvedValue({ next_log_id: 1 });
    });

    
    it("allows manual integer log ID entry when manualLogId is enabled in developer features", async () => {
        (apiClient.post as any).mockResolvedValue({
            id: 100,
            service_code: "100",
            log_id: "100",
            customer_name: "Ganesh",
            contact_number: "9876543210",
        });

        render(
            <BrowserRouter>
                <NewService />
            </BrowserRouter>
        );

        // Check manual inputs are present
        expect(screen.getByText(/Manual Log IDs/i)).toBeInTheDocument();
        const serviceLogInput = screen.getByLabelText(/Service Log ID/i);
        const customerLogInput = screen.getByLabelText(/Customer Log ID/i);

        // Type numbers and non-numbers; non-numbers must be rejected
        fireEvent.change(serviceLogInput, { target: { value: "100abc" } });
        expect(serviceLogInput).toHaveValue("100");

        fireEvent.change(customerLogInput, { target: { value: "50xyz" } });
        expect(customerLogInput).toHaveValue("50");

        const phoneInput = screen.getByPlaceholderText("+91");
        fireEvent.change(phoneInput, { target: { value: "9876543210" } });

        fireEvent.click(screen.getByRole("button", { name: /Initialize Service Entry/i }));

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith(
                "/services",
                expect.objectContaining({
                    service_code: "100",
                    log_id: "100",
                    customer_code: "50",
                    customer_log_id: "50",
                })
            );
        });
    });

    it("renders compact service registration form with only Contact Number marked mandatory", () => {
        render(
            <BrowserRouter>
                <NewService />
            </BrowserRouter>
        );

        expect(screen.getByRole("heading", { name: /New Service/i })).toBeInTheDocument();
        expect(screen.getByText(/Customer Information/i)).toBeInTheDocument();
        expect(screen.getByText(/Contact Number \*/i)).toBeInTheDocument();
        expect(screen.getByText(/^Full Name$/i)).toBeInTheDocument();
        expect(screen.getByText(/Service Details/i)).toBeInTheDocument();
    });

    it("shows error when submitting without Contact Number", async () => {
        render(
            <BrowserRouter>
                <NewService />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByRole("button", { name: /Initialize Service Entry/i }));

        await waitFor(() => {
            expect(screen.getByText(/Please enter Contact Number/i)).toBeInTheDocument();
        });
        expect(apiClient.post).not.toHaveBeenCalled();
    });

    it("allows submitting service entry with only Contact Number", async () => {
        (apiClient.post as any).mockResolvedValue({
            id: 999,
            customer_name: "Customer",
            contact_number: "9876543210",
        });

        render(
            <BrowserRouter>
                <NewService />
            </BrowserRouter>
        );

        const phoneInput = screen.getByPlaceholderText("+91");
        fireEvent.change(phoneInput, { target: { value: "9876543210" } });

        fireEvent.click(screen.getByRole("button", { name: /Initialize Service Entry/i }));

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith(
                "/services",
                expect.objectContaining({
                    contact_number: "9876543210",
                    customer_name: "Customer",
                })
            );
        });

        await waitFor(() => {
            expect(screen.getByText(/Log Created/i)).toBeInTheDocument();
            expect(screen.getByText("#999")).toBeInTheDocument();
        });
    });
});
