import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import { ReportsHome } from "./ReportsHome";

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { name: "Rajesh Kumar", role: "admin" },
  }),
}));

const renderComponent = () =>
  render(
    <BrowserRouter>
      <ReportsHome />
    </BrowserRouter>
  );

describe("ReportsHome Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Report Home header and only the 4 active report cards", () => {
    renderComponent();

    expect(screen.getByText("Report Home")).toBeInTheDocument();

    // Verify exactly the 4 required reports are present
    expect(screen.getByText("General Ledger")).toBeInTheDocument();
    expect(screen.getByText("Battery Sales & Bills")).toBeInTheDocument();
    expect(screen.getByText("Estimates & Quotations")).toBeInTheDocument();
    expect(screen.getByText("Services & Job Orders")).toBeInTheDocument();

    // Verify other categories are no longer shown
    expect(screen.queryByText("Battery Exchange Report")).not.toBeInTheDocument();
    expect(screen.queryByText("Stock & Inventory Registry")).not.toBeInTheDocument();
    expect(screen.queryByText("Warranty Claims & History")).not.toBeInTheDocument();
    expect(screen.queryByText("GST Tax Return Report")).not.toBeInTheDocument();
    expect(screen.queryByText("Daily Collection Summary")).not.toBeInTheDocument();
  });

  it("filters reports by keyword when typing in search input", async () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(/Search reports/i);
    fireEvent.change(searchInput, { target: { value: "Ledger" } });

    await waitFor(() => {
      expect(screen.getByText("General Ledger")).toBeInTheDocument();
      expect(screen.queryByText("Battery Sales & Bills")).not.toBeInTheDocument();
    });
  });

  it("navigates to relevant report route when report card is clicked", () => {
    renderComponent();

    const salesReportBtn = screen.getByText("Battery Sales & Bills");
    fireEvent.click(salesReportBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/reports/sales");

    const ledgerBtn = screen.getByText("General Ledger");
    fireEvent.click(ledgerBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/reports/general-ledger");

    const quotesBtn = screen.getByText("Estimates & Quotations");
    fireEvent.click(quotesBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/reports/quotations");

    const serviceBtn = screen.getByText("Services & Job Orders");
    fireEvent.click(serviceBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/reports/services");
  });
});
