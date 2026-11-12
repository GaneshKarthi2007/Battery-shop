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
let mockShopConfig = { serviceLogIdPrefix: "" };

vi.mock("../contexts/DeveloperContext", async () => {
    const actual = await vi.importActual<typeof import("../contexts/DeveloperContext")>("../contexts/DeveloperContext");
    return {
        ...actual,
        useDeveloper: () => ({
            features: mockFeatures,
            shopConfig: mockShopConfig,
        }),
    };
});

describe("NewService Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFeatures = { enableContactActions: false, autoGenerateServiceLogId: false };
        mockShopConfig = { serviceLogIdPrefix: "" };
        (apiClient.get as any).mockResolvedValue({ next_log_id: 1 });
    });

    it("renders every field and the submit button inside one compact card", () => {
        render(
            <BrowserRouter>
                <NewService />
            </BrowserRouter>
        );

        const card = screen.getByTestId("new-service-card");
        // All inputs live in the same card (no separate section cards to scroll through)
        expect(card).toContainElement(screen.getByLabelText(/Service Log ID/i));
        expect(card).toContainElement(screen.getByRole("button", { name: /Complaint Type/i }));
        expect(card).toContainElement(screen.getByPlaceholderText("SMR"));
        expect(card).toContainElement(screen.getByPlaceholderText("+91"));
        expect(card).toContainElement(screen.getByLabelText(/Service Address/i));
        expect(card).toContainElement(screen.getByLabelText(/Issue Description/i));
        expect(card).toContainElement(screen.getByRole("button", { name: /Record Voice Note/i }));
        expect(card).toContainElement(screen.getByRole("button", { name: /Initialize Service Entry/i }));
        expect(card).toContainElement(screen.getByRole("button", { name: /Discard/i }));

        // Only one white card wrapper in the form
        expect(document.querySelectorAll('[data-testid="new-service-card"]')).toHaveLength(1);
        // Service Address is a single-line input, not a textarea
        expect(screen.getByLabelText(/Service Address/i).tagName).toBe("INPUT");
    });

    it("does not render a prefix chip when no Service Log ID prefix is configured", () => {
        render(
            <BrowserRouter>
                <NewService />
            </BrowserRouter>
        );
        expect(screen.queryByTestId("service-log-id-prefix")).not.toBeInTheDocument();
    });

    it("shows the configured Service Log ID prefix next to the input and still posts digits only", async () => {
        mockShopConfig = { serviceLogIdPrefix: "SRV-" };
        (apiClient.post as any).mockResolvedValue({
            id: 7,
            service_code: "42",
            log_id: "42",
            customer_name: "Customer",
            contact_number: "9876543210",
        });

        render(
            <BrowserRouter>
                <NewService />
            </BrowserRouter>
        );

        expect(screen.getByTestId("service-log-id-prefix")).toHaveTextContent("SRV-");

        fireEvent.change(screen.getByLabelText(/Service Log ID/i), { target: { value: "42" } });
        fireEvent.change(screen.getByPlaceholderText("+91"), { target: { value: "9876543210" } });
        fireEvent.click(screen.getByRole("button", { name: /Initialize Service Entry/i }));

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalledWith(
                "/services",
                expect.objectContaining({ service_code: "42", log_id: "42" })
            );
        });

        // Success card shows the prefixed log ID (not the raw DB id)
        await waitFor(() => {
            expect(screen.getByText("#SRV-42")).toBeInTheDocument();
        });
    });

    it("uses the prefix in the auto-generated placeholder when auto mode is on", async () => {
        mockFeatures.autoGenerateServiceLogId = true;
        mockShopConfig = { serviceLogIdPrefix: "JOB" };
        (apiClient.get as any).mockResolvedValue({ next_log_id: 15 });

        render(
            <BrowserRouter>
                <NewService />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByPlaceholderText("Auto: JOB15")).toBeInTheDocument();
        });
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

    it("keeps the full contact number visible on mobile (Copy action is not overlaid on the input)", () => {
        render(
            <BrowserRouter>
                <NewService />
            </BrowserRouter>
        );

        const phoneInput = screen.getByPlaceholderText("+91");
        fireEvent.change(phoneInput, { target: { value: "+91 98765 43210" } });

        const copyBtn = screen.getByTitle("Copy to Clipboard");
        const actions = screen.getByTestId("contact-actions");
        expect(actions).toContainElement(copyBtn);

        // Actions must not live inside the input's wrapper (where they covered the digits)
        expect(phoneInput.parentElement).not.toContainElement(copyBtn);
        expect(actions.className).not.toMatch(/absolute/);
        // No large right padding reserved for an overlay
        expect(phoneInput.className).not.toMatch(/pr-14|pr-20/);
        expect(phoneInput).toHaveValue("+91 98765 43210");
        // Label is still wired to the input
        expect(screen.getByLabelText(/Contact Number/i)).toBe(phoneInput);
    });

    it("shows Call/WhatsApp actions outside the input when contact actions are enabled", () => {
        mockFeatures = { enableContactActions: true, autoGenerateServiceLogId: false };
        render(
            <BrowserRouter>
                <NewService />
            </BrowserRouter>
        );

        const phoneInput = screen.getByPlaceholderText("+91");
        fireEvent.change(phoneInput, { target: { value: "9876543210" } });

        expect(phoneInput.parentElement).not.toContainElement(screen.getByTitle("Call Customer"));
        expect(phoneInput.parentElement).not.toContainElement(screen.getByTitle("WhatsApp Customer"));
    });
});
