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

let mockFeatures = { enableContactActions: false, autoGenerateServiceLogId: false };

vi.mock("../contexts/DeveloperContext", () => ({
    useDeveloper: () => ({
        features: mockFeatures,
    }),
}));

describe("NewService Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFeatures = { enableContactActions: false, autoGenerateServiceLogId: false };
        (apiClient.get as any).mockResolvedValue({ next_log_id: 1 });
    });

    it("renders Service Log ID text box and does not render Customer Log ID", () => {
        render(
            <BrowserRouter>
                <NewService />
            </BrowserRouter>
        );

        expect(screen.getByRole("heading", { name: /New Service/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Service Log ID/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/Customer Log ID/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Manual Log IDs \(Integer Only - Leave blank for Auto\)/i)).not.toBeInTheDocument();
    });

    it("shows error when auto-generation is disabled and Service Log ID is not entered", async () => {
        mockFeatures.autoGenerateServiceLogId = false;

        render(
            <BrowserRouter>
                <NewService />
            </BrowserRouter>
        );

        const phoneInput = screen.getByPlaceholderText("+91");
        fireEvent.change(phoneInput, { target: { value: "9876543210" } });

        fireEvent.click(screen.getByRole("button", { name: /Initialize Service Entry/i }));

        await waitFor(() => {
            expect(screen.getByText(/Please enter Service Log ID/i)).toBeInTheDocument();
        });
        expect(apiClient.post).not.toHaveBeenCalled();
    });

    it("allows manual integer service log ID and strips non-numeric characters", async () => {
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

        const serviceLogInput = screen.getByLabelText(/Service Log ID/i);

        // Type characters; non-digits must be stripped immediately
        fireEvent.change(serviceLogInput, { target: { value: "100abc" } });
        expect(serviceLogInput).toHaveValue("100");

        const phoneInput = screen.getByPlaceholderText("+91");
        fireEvent.change(phoneInput, { target: { value: "9876543210" } });

        fireEvent.click(screen.getByRole("button", { name: /Initialize Service Entry/i }));

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith(
                "/services",
                expect.objectContaining({
                    service_code: "100",
                    log_id: "100",
                    contact_number: "9876543210",
                })
            );
        });
    });

    it("allows auto-generating service log ID when developer grants permission", async () => {
        mockFeatures.autoGenerateServiceLogId = true;
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
                    allow_auto_id: true,
                })
            );
        });
    });
});
