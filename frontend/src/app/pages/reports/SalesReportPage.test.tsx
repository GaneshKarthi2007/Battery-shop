import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";
import { SalesReportPage } from "./SalesReportPage";
import { apiClient } from "../../api/client";

vi.mock("../../api/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
  BASE_URL: "http://localhost:8000/api",
}));

const mockInvoices = [
  {
    id: "sale-1",
    raw_id: 1,
    invoice_number: "INV-00001",
    date: "20-11-2026",
    customer_name: "Ganesh Karthi",
    customer_phone: "9876543210",
    vehicle_details: "TN 38 AB 1234",
    payment_method: "Cash",
    type: "Sale",
    items_summary: "1x Exide Mileage 35Ah",
    amount: 5000,
    gst: 900,
    total: 5900,
  },
  {
    id: "sale-2",
    raw_id: 2,
    invoice_number: "INV-00002",
    date: "21-11-2026",
    customer_name: "Ramesh Babu",
    customer_phone: "9123456789",
    vehicle_details: "TN 37 CD 5678",
    payment_method: "UPI",
    type: "Sale",
    items_summary: "1x Amaron Pro 45Ah",
    amount: 6000,
    gst: 1080,
    total: 7080,
  },
];

describe("SalesReportPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({ invoices: mockInvoices });
  });

  it("initially does not list transactions and shows filter prompt", () => {
    render(
      <MemoryRouter>
        <SalesReportPage
          reportType="Sale"
          title="Bills / Sales Report"
          description="Battery sale invoices with GST breakdown"
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 1, name: /bills \/ sales report/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /select filters to view/i })).toBeInTheDocument();
    expect(screen.queryByText("INV-00001")).not.toBeInTheDocument();
  });

  it("filters sales report data when submitting date range and payment mode", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SalesReportPage
          reportType="Sale"
          title="Bills / Sales Report"
          description="Battery sale invoices with GST breakdown"
        />
      </MemoryRouter>
    );

    const fromInput = screen.getByLabelText(/start date/i);
    const toInput = screen.getByLabelText(/end date/i);
    const modeSelect = screen.getByLabelText(/payment mode \/ type/i);

    fireEvent.change(fromInput, { target: { value: "20-11-2026" } });
    fireEvent.change(toInput, { target: { value: "22-11-2026" } });
    await user.selectOptions(modeSelect, "All");

    const filterBtn = screen.getByRole("button", { name: /filter data/i });
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("from=2026-11-20")
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("to=2026-11-22")
      );
    });

    // Check KPI cards
    await waitFor(() => {
      expect(screen.getAllByText(/Total Invoices/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Base Sales/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/GST Tax 18%/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Total Revenue/i).length).toBeGreaterThanOrEqual(1);

      // Check values
      expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/11,000.00/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/1,980.00/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/12,980.00/i).length).toBeGreaterThanOrEqual(1);

      // Check desktop transaction rows
      expect(screen.getByText("INV-00001")).toBeInTheDocument();
      expect(screen.getByText("INV-00002")).toBeInTheDocument();
      expect(screen.getByText("Ganesh Karthi")).toBeInTheDocument();
      expect(screen.getByText("Ramesh Babu")).toBeInTheDocument();
      expect(screen.getByText("20-11-2026")).toBeInTheDocument();
      expect(screen.getByText("21-11-2026")).toBeInTheDocument();
    });
  });

  it("renders download buttons and triggers download", async () => {
    const mockBlob = new Blob(["sample"], { type: "text/csv" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    window.fetch = fetchMock;
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/csv");
    window.URL.revokeObjectURL = vi.fn();

    render(
      <MemoryRouter>
        <SalesReportPage
          reportType="Sale"
          title="Bills / Sales Report"
          description="Battery sale invoices with GST breakdown"
        />
      </MemoryRouter>
    );

    const filterBtn = screen.getByRole("button", { name: /filter data/i });
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /download csv/i }).length).toBeGreaterThanOrEqual(1);
    });

    const csvBtn = screen.getAllByRole("button", { name: /download csv/i })[0];
    fireEvent.click(csvBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/reports/download?type=Sale"),
        expect.anything()
      );
    });

    const pdfBtn = screen.getAllByRole("button", { name: /download pdf/i })[0];
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/reports/download/pdf?type=Sale"),
        expect.anything()
      );
    });
  });

  it("resets filter form when Reset is clicked", async () => {
    render(
      <MemoryRouter>
        <SalesReportPage
          reportType="Sale"
          title="Bills / Sales Report"
          description="Battery sale invoices with GST breakdown"
        />
      </MemoryRouter>
    );

    const filterBtn = screen.getByRole("button", { name: /filter data/i });
    fireEvent.click(filterBtn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText(/select filters to view bills \/ sales report/i)).toBeInTheDocument();
  });
});
