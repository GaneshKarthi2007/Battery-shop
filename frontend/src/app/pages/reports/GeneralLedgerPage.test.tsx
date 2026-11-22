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
  date_from: "2026-10-01",
  date_to: "2026-10-31",
  opening_balance: 50000,
  opening_balance_type: "Dr",
  total_debit: 10000,
  total_credit: 2000,
  closing_balance: 58000,
  closing_balance_type: "Dr",
  count: 2,
  available_ledgers: ["CASH", "TMB LTD", "OFFICE CONSUMABLES", "TELEPHONE EXPENSES"],
  entries: [
    {
      id: 1,
      entry_number: "TXN-00001",
      date: "2026-10-05",
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
      status: "Settled",
    },
    {
      id: 2,
      entry_number: "TXN-00002",
      date: "2026-10-15",
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
      status: "Settled",
    },
  ],
};

describe("GeneralLedgerPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue(mockData);
  });

  it("renders header, KPI cards, and ledger statement entries", async () => {
    render(
      <MemoryRouter>
        <GeneralLedgerPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /general ledger report/i })).toBeInTheDocument();

    await waitFor(() => {
      // Check KPI values
      expect(screen.getAllByText(/₹ 50,000.00/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/₹ 10,000.00/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/₹ 2,000.00/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/₹ 58,000.00/i).length).toBeGreaterThanOrEqual(1);

      // Check Table rows
      expect(screen.getAllByText("COUNTER BATTERY SALE CASH").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("OFFICE CONSUMABLES EXPENSE").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("TXN-00001").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("TXN-00002").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("filters ledger records when selecting a specific ledger", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <GeneralLedgerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/account \/ ledger/i)).toBeInTheDocument();
    });

    const ledgerSelect = screen.getByLabelText(/account \/ ledger/i);
    await user.selectOptions(ledgerSelect, "TMB LTD");

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("ledger=TMB+LTD")
      );
    });
  });

  it("filters ledger records by date from and date to", async () => {
    render(
      <MemoryRouter>
        <GeneralLedgerPage />
      </MemoryRouter>
    );

    const dateFromInput = screen.getByLabelText(/from date/i);
    const dateToInput = screen.getByLabelText(/to date/i);

    fireEvent.change(dateFromInput, { target: { value: "2026-10-01" } });
    fireEvent.change(dateToInput, { target: { value: "2026-10-31" } });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("from=2026-10-01")
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("to=2026-10-31")
      );
    });
  });

  it("applies quick period presets", async () => {
    render(
      <MemoryRouter>
        <GeneralLedgerPage />
      </MemoryRouter>
    );

    const todayButton = screen.getByRole("button", { name: /^today$/i });
    fireEvent.click(todayButton);

    const todayStr = new Date().toISOString().split("T")[0];
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`from=${todayStr}`)
      );
    });
  });

  it("resets filters when clicking Reset Filters", async () => {
    render(
      <MemoryRouter>
        <GeneralLedgerPage />
      </MemoryRouter>
    );

    const dateFromInput = screen.getByLabelText(/from date/i);
    fireEvent.change(dateFromInput, { target: { value: "2026-10-15" } });

    const resetBtn = screen.getByRole("button", { name: /reset filters/i });
    fireEvent.click(resetBtn);

    expect(dateFromInput).toHaveValue("");
  });
});
