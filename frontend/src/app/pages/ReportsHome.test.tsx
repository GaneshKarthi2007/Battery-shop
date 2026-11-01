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

  it("renders Report Home header and all category cards", () => {
    renderComponent();

    expect(screen.getByText("Report Home")).toBeInTheDocument();
    expect(screen.getByText(/Comprehensive reporting hub for sales/i)).toBeInTheDocument();

    // Check categories
    expect(screen.getByText("Sales & Invoicing")).toBeInTheDocument();
    expect(screen.getByText("Battery Exchange & Stock")).toBeInTheDocument();
    expect(screen.getByText("Services & Warranty")).toBeInTheDocument();
    expect(screen.getByText("Financial & Tax Summary")).toBeInTheDocument();
  });

  it("filters reports by keyword when typing in search input", async () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(/Search reports or category/i);
    fireEvent.change(searchInput, { target: { value: "GST" } });

    await waitFor(() => {
      expect(screen.getByText(/matching "GST"/i)).toBeInTheDocument();
      expect(screen.getByText("GST Tax Return Report")).toBeInTheDocument();
    });
  });

  it("navigates to relevant report route when category item is clicked", () => {
    renderComponent();

    const salesReportBtn = screen.getByText("Battery Sales & Bills");
    fireEvent.click(salesReportBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/reports/sales");
  });
});
