import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MiscTransactions } from "./MiscTransactions";
import { apiClient } from "../api/client";

vi.mock("../api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("MiscTransactions Component (Accounts Maintenance)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as any).mockResolvedValue({
      status: "success",
      data: [
        {
          id: 1,
          entry_number: "TXN-00001",
          date: "2026-10-29",
          type: "Cash",
          particular: "KVT BSNL BILL",
          debit_amount: 1000.0,
          credit_amount: 0.0,
          debit_ledger: "TELEPHONE EXPENSES",
          credit_ledger: "CASH",
          status: "Settled",
        },
        {
          id: 2,
          entry_number: "TXN-00002",
          date: "2026-10-29",
          type: "Journal",
          particular: "BID ADVANCE TMB LTD",
          debit_amount: 50000.0,
          credit_amount: 50000.0,
          debit_ledger: "PROCESSING_CHIT_PAYMENT",
          credit_ledger: "TMB LTD",
          bank_name: "TMB LTD",
          cheque_no: "2430158",
          status: "Settled",
        },
      ],
    });
  });

  it("renders General Transaction table header, + ADD NEW button and data rows", async () => {
    render(<MiscTransactions />);

    expect(screen.getByText("General Transaction")).toBeInTheDocument();
    expect(screen.getByText("+ ADD NEW")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("KVT BSNL BILL")).toBeInTheDocument();
      expect(screen.getByText("BID ADVANCE TMB LTD")).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Particular")).toBeInTheDocument();
    expect(screen.getByText("Debit Amount")).toBeInTheDocument();
    expect(screen.getByText("Credit Amount")).toBeInTheDocument();
    expect(screen.getByText("Debit Ledger")).toBeInTheDocument();
    expect(screen.getByText("Credit Ledger")).toBeInTheDocument();
    expect(screen.getAllByText("Type")[0]).toBeInTheDocument();
  });

  it("opens Choose Transaction Type modal when + ADD NEW is clicked", async () => {
    render(<MiscTransactions />);

    const addNewBtn = screen.getByText("+ ADD NEW");
    fireEvent.click(addNewBtn);

    expect(screen.getByText("Choose Transaction Type")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "CASH" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "JOURNAL" })).toBeInTheDocument();

    // Clicking CANCEL closes the modal
    const cancelBtn = screen.getByText("CANCEL");
    fireEvent.click(cancelBtn);

    expect(screen.queryByText("Choose Transaction Type")).not.toBeInTheDocument();
  });

  it("navigates to Add Transaction form when type is chosen and SUBMIT is clicked", async () => {
    render(<MiscTransactions />);

    fireEvent.click(screen.getByText("+ ADD NEW"));
    expect(screen.getByText("Choose Transaction Type")).toBeInTheDocument();

    // Select JOURNAL
    const journalRadio = screen.getByLabelText("JOURNAL");
    fireEvent.click(journalRadio);

    const submitBtn = screen.getByText("SUBMIT");
    fireEvent.click(submitBtn);

    // Should now be in the Add Form view
    await waitFor(() => {
      expect(screen.getByText("General Transaction Journal Add")).toBeInTheDocument();
      expect(screen.getByText("Journal Mode")).toBeInTheDocument();
      expect(screen.getByText("Credit")).toBeInTheDocument();
      expect(screen.getByText("Debit")).toBeInTheDocument();
      expect(screen.getByText("Attachments")).toBeInTheDocument();
      expect(screen.getByText("Upload photo")).toBeInTheDocument();
    });
  });

  it("allows adding credit/debit lines and submitting the form", async () => {
    (apiClient.post as any).mockResolvedValue({
      status: "success",
      data: {
        id: 99,
        entry_number: "TXN-00099",
        date: "2026-11-02",
        type: "Cash",
        particular: "WORKSHOP COFFEE AND TEA",
        debit_amount: 150.0,
        credit_amount: 150.0,
        debit_ledger: "OFFICE CONSUMABLES",
        credit_ledger: "CASH",
        status: "Settled",
      },
    });

    render(<MiscTransactions />);

    // Open Cash form
    fireEvent.click(screen.getByText("+ ADD NEW"));
    fireEvent.click(screen.getByText("SUBMIT"));

    await waitFor(() => {
      expect(screen.getByText("General Transaction Cash Add")).toBeInTheDocument();
    });

    // Fill Particulars
    const particularsInput = screen.getByLabelText("Particulars *");
    fireEvent.change(particularsInput, { target: { value: "WORKSHOP COFFEE AND TEA" } });

    // Fill Credit amount
    const creditAmountInput = screen.getByLabelText("Credit Amount *");
    fireEvent.change(creditAmountInput, { target: { value: "150" } });

    // Fill Debit ledger and amount
    const debitLedgerInput = screen.getByLabelText("Debit Ledger *");
    fireEvent.change(debitLedgerInput, { target: { value: "OFFICE CONSUMABLES" } });

    const debitAmountInput = screen.getByLabelText("Debit Amount *");
    fireEvent.change(debitAmountInput, { target: { value: "150" } });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: "SUBMIT" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Cash transaction saved successfully!")).toBeInTheDocument();
    });
  });
});

describe("MiscTransactions responsive list", () => {
  const originalWidth = window.innerWidth;
  afterEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: originalWidth });
  });

  it("shows transactions as full-width cards on mobile widths", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 390 });
    (apiClient.get as any).mockResolvedValue({
      status: "success",
      data: [
        {
          id: 1,
          entry_number: "TXN-00001",
          date: "2026-10-29",
          type: "Cash",
          particular: "KVT BSNL BILL",
          debit_amount: 1000.0,
          credit_amount: 0.0,
          debit_ledger: "TELEPHONE EXPENSES",
          credit_ledger: "CASH",
          status: "Settled",
        },
      ],
    });

    render(<MiscTransactions />);

    await waitFor(() => {
      expect(screen.getByText("KVT BSNL BILL")).toBeInTheDocument();
    });
    const cards = screen.getByTestId("report-table-cards");
    expect(cards).toBeInTheDocument();
    expect(cards.className).toContain("w-full");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Options" })).toBeInTheDocument();
  });
});
