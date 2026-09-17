import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import { Reports } from "./Reports";
import { apiClient } from "../api/client";
import { DeveloperProvider } from "../contexts/DeveloperContext";

vi.mock("../api/client", () => ({
    apiClient: {
        get: vi.fn(),
    },
    BASE_URL: "http://localhost:8000/api",
}));

const mockReportData = {
    invoices: [
        {
            id: "sale-1",
            raw_id: 1,
            invoice_number: "INV-00001",
            date: "2026-03-10T10:00:00.000Z",
            customer_name: "Alice Smith",
            customer_phone: "9876543210",
            type: "Sale",
            items_summary: "1x Exide Matrix",
            amount: 4237.29,
            gst: 762.71,
            total: 5000,
        },
        {
            id: "sale-2",
            raw_id: 2,
            invoice_number: "QTN-00002",
            date: "2026-03-11T12:00:00.000Z",
            customer_name: "Bob Jones",
            customer_phone: "9876543211",
            type: "Quotation",
            items_summary: "2x Amaron Flo",
            amount: 10169.49,
            gst: 1830.51,
            total: 12000,
        },
    ],
    summary: {
        totalSales: 17000,
        totalGST: 2593.22,
        totalProfit: 3400,
        invoiceCount: 2,
        salesByType: {
            Sale: 5000,
            Exchange: 0,
            Service: 0,
            Quotation: 12000,
        },
    },
};

const renderComponent = () =>
    render(
        <BrowserRouter>
            <DeveloperProvider>
                <Reports />
            </DeveloperProvider>
        </BrowserRouter>
    );

describe("Reports Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (apiClient.get as any).mockResolvedValue(mockReportData);
    });

    it("renders page header, summary analytics, and filter pills", async () => {
        renderComponent();

        expect(screen.getByText("Reports & History Central")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Alice Smith")).toBeInTheDocument();
            expect(screen.getByText("Bob Jones")).toBeInTheDocument();
            expect(screen.getByText("INV-00001")).toBeInTheDocument();
            expect(screen.getByText("QTN-00002")).toBeInTheDocument();
        });
    });

    it("filters records by type when filter pills are clicked", async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText("Alice Smith")).toBeInTheDocument();
        });

        const quotationPill = screen.getByRole("button", { name: "Quotations" });
        await act(async () => {
            fireEvent.click(quotationPill);
        });

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining("type=Quotation"));
        });
    });

    it("opens Filter & Sort modal and applies custom sorting option", async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText("Alice Smith")).toBeInTheDocument();
        });

        const filterBtn = screen.getByRole("button", { name: /Filter and Sort Records/i });
        await act(async () => {
            fireEvent.click(filterBtn);
        });

        expect(screen.getByText("Filter & Sort Records")).toBeInTheDocument();

        const highestAmountOption = screen.getByRole("button", { name: /Highest Amount/i });
        await act(async () => {
            fireEvent.click(highestAmountOption);
        });

        const applyBtn = screen.getByRole("button", { name: "Apply" });
        await act(async () => {
            fireEvent.click(applyBtn);
        });

        // Modal closed
        expect(screen.queryByText("Filter & Sort Records")).not.toBeInTheDocument();
    });

    it("renders export section at the bottom of the page when reportExport is enabled", async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText("Export Report Data")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Export CSV" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Export PDF Report" })).toBeInTheDocument();
        });
    });
});
