import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";
import { GeneralLedgerPage } from "./GeneralLedgerPage";
import { apiClient } from "../../api/client";

vi.mock("../../api/client", () => ({
  apiClient: {
    get: vi.fn(),
  },
  BASE_URL: "http://localhost:8000/api",
}));

const mockData = {
  ledger: "CASH",
  type: "All",
  date_from: "01-10-2026",
  date_to: "31-10-2026",
  opening_balance: 50000,
  opening_balance_type: "Dr",
  total_outgoing: 10000,
  total_income: 2000,
  total_debit: 10000,
  total_credit: 2000,
  closing_balance: 58000,
  closing_balance_type: "Dr",
  count: 2,
  available_ledgers: ["CASH", "TMB LTD", "OFFICE CONSUMABLES", "TELEPHONE EXPENSES"],
  entries: [
    {
      id: 1,
      s_no: 1,
      entry_number: "TXN-00001",
      date: "05-10-2026",
      type: "Cash",
      particular: "COUNTER BATTERY SALE CASH",
      debit_ledger: "CASH",
      credit_ledger: "SALES REVENUE",
      contra_ledger: "SALES REVENUE",
      debit: 10000,
      credit: 0,
      running_balance: 60000,
      balance_type: "Dr",
      bank_name: null,
      cheque_no: null,
      comments: "Settled",
      status: "Settled",
    },
    {
      id: 2,
      s_no: 2,
      entry_number: "TXN-00002",
      date: "15-10-2026",
      type: "Cash",
      particular: "OFFICE CONSUMABLES EXPENSE",
      debit_ledger: "OFFICE CONSUMABLES",
      credit_ledger: "CASH",
      contra_ledger: "OFFICE CONSUMABLES",
      debit: 0,
      credit: 2000,
      running_balance: 58000,
      balance_type: "Dr",
      bank_name: null,
      cheque_no: null,
      comments: "Settled",
      status: "Settled",
    },
  ],
};

describe("GeneralLedgerPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue(mockData);
  });

  it("initially does not list transactions and shows filter prompt", async () => {
    render(
      <MemoryRouter>
        <GeneralLedgerPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /general ledger report/i })).toBeInTheDocument();
    expect(screen.getByText(/select filters to view general ledger/i)).toBeInTheDocument();
    expect(screen.queryByText("COUNTER BATTERY SALE CASH")).not.toBeInTheDocument();
  });

  it("filters ledger data when selecting start date, end date, ledger, voucher type, and clicking Filter Data", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <GeneralLedgerPage />
      </MemoryRouter>
    );

    // Initial pre-fetch of available ledgers
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/reports/general-ledger?ledger=All");
    });

    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    const ledgerSelect = screen.getByLabelText(/^ledger$/i);
    const voucherTypeSelect = screen.getByLabelText(/voucher type/i);

    fireEvent.change(startDateInput, { target: { value: "2026-10-01" } });
    fireEvent.change(endDateInput, { target: { value: "2026-10-31" } });
    await user.selectOptions(ledgerSelect, "CASH");
    await user.selectOptions(voucherTypeSelect, "Cash");

    const filterButton = screen.getByRole("button", { name: /filter data/i });
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("from=2026-10-01")
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("to=2026-10-31")
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("ledger=CASH")
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("type=Cash")
      );
    });

    // Check summary cards
    await waitFor(() => {
      expect(screen.getAllByText(/Opening Balance/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Total Income/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Total Outgoing/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Closing Balance/i).length).toBeGreaterThanOrEqual(1);

      // Check values
      expect(screen.getAllByText(/₹ 50,000.00/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/₹ 10,000.00/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/₹ 2,000.00/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/₹ 58,000.00/i).length).toBeGreaterThanOrEqual(1);

      // Check desktop transactions table
      expect(screen.getByText("COUNTER BATTERY SALE CASH")).toBeInTheDocument();
      expect(screen.getByText("OFFICE CONSUMABLES EXPENSE")).toBeInTheDocument();
      expect(screen.getByText("TXN-00001")).toBeInTheDocument();
      expect(screen.getByText("TXN-00002")).toBeInTheDocument();

      // Check date format in DD-MM-YYYY
      expect(screen.getByText("05-10-2026")).toBeInTheDocument();
      expect(screen.getByText("15-10-2026")).toBeInTheDocument();
    });
  });

  it("renders top download buttons and mobile download buttons after filtering", async () => {
    render(
      <MemoryRouter>
        <GeneralLedgerPage />
      </MemoryRouter>
    );

    const filterButton = screen.getByRole("button", { name: /filter data/i });
    fireEvent.click(filterButton);

    await waitFor(() => {
      const pdfButtons = screen.getAllByRole("button", { name: /download pdf/i });
      expect(pdfButtons.length).toBeGreaterThanOrEqual(1);

      const csvButtons = screen.getAllByRole("button", { name: /download csv/i });
      expect(csvButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("triggers CSV and PDF downloads when clicked", async () => {
    const mockBlob = new Blob(["test"], { type: "text/csv" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    window.fetch = fetchMock;
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/1234");
    window.URL.revokeObjectURL = vi.fn();

    render(
      <MemoryRouter>
        <GeneralLedgerPage />
      </MemoryRouter>
    );

    const filterButton = screen.getByRole("button", { name: /filter data/i });
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /download csv/i }).length).toBeGreaterThanOrEqual(1);
    });

    const csvButton = screen.getAllByRole("button", { name: /download csv/i })[0];
    fireEvent.click(csvButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/reports/general-ledger/download"),
        expect.anything()
      );
    });

    const pdfButton = screen.getAllByRole("button", { name: /download pdf/i })[0];
    fireEvent.click(pdfButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/reports/general-ledger/pdf"),
        expect.anything()
      );
    });
  });

  it("resets filter form and returns to initial prompt state when Reset is clicked", async () => {
    render(
      <MemoryRouter>
        <GeneralLedgerPage />
      </MemoryRouter>
    );

    const filterButton = screen.getByRole("button", { name: /filter data/i });
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText(/select filters to view general ledger/i)).toBeInTheDocument();
  });
});
