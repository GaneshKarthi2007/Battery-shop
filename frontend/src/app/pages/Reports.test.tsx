import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import { Reports } from "./Reports";
import { apiClient } from "../api/client";

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

describe("Reports Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (apiClient.get as any).mockResolvedValue(mockReportData);
    });

    it("renders page header, summary analytics, and filter pills", async () => {
        render(
            <BrowserRouter>
                <Reports />
            </BrowserRouter>
        );

        expect(screen.getByText("Reports & History Central")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Alice Smith")).toBeInTheDocument();
            expect(screen.getByText("Bob Jones")).toBeInTheDocument();
            expect(screen.getByText("INV-00001")).toBeInTheDocument();
            expect(screen.getByText("QTN-00002")).toBeInTheDocument();
        });
    });

    it("filters records by type when filter pills are clicked", async () => {
        render(
            <BrowserRouter>
                <Reports />
            </BrowserRouter>
        );

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

    it("allows sorting by customer name or total amount", async () => {
        render(
            <BrowserRouter>
                <Reports />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("Alice Smith")).toBeInTheDocument();
        });

        const sortSelect = screen.getByLabelText("Sort History");
        await act(async () => {
            fireEvent.change(sortSelect, { target: { value: "amount_desc" } });
        });

        expect(sortSelect).toHaveValue("amount_desc");
    });
});
