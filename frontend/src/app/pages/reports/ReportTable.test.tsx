import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { ReportTable, SearchPanelField } from "./ReportTable";

interface MockRecord {
  id: string;
  invoice_number: string;
  date: string;
  customer_name: string;
  amount: number;
  type: string;
}

const mockData: MockRecord[] = [
  {
    id: "1",
    invoice_number: "INV-1001",
    date: "2026-03-10",
    customer_name: "Rajesh Sharma",
    amount: 4500,
    type: "Sale",
  },
  {
    id: "2",
    invoice_number: "EXC-2002",
    date: "2026-03-11",
    customer_name: "Anita Verma",
    amount: 1200,
    type: "Exchange",
  },
  {
    id: "3",
    invoice_number: "SRV-3003",
    date: "2026-03-12",
    customer_name: "Vikram Singh",
    amount: 750,
    type: "Service",
  },
];

const mockColumns = [
  { key: "invoice_number", header: "Invoice No." },
  { key: "date", header: "Date" },
  { key: "customer_name", header: "Customer Name" },
  { key: "amount", header: "Amount" },
  { key: "type", header: "Type" },
];

const mockSearchPanelFields: SearchPanelField<MockRecord>[] = [
  { key: "invoice_number", label: "Ent. No", type: "text", placeholder: "Filter Ent No" },
  { key: "date", label: "Entry Date", type: "date" },
  { key: "customer_name", label: "Party Name", type: "text", placeholder: "Filter Party" },
  { key: "amount", label: "Amount", type: "number" },
  {
    key: "type",
    label: "Status / Type",
    type: "select",
    options: [
      { value: "Sale", label: "Sale" },
      { value: "Exchange", label: "Exchange" },
      { value: "Service", label: "Service" },
    ],
  },
];

describe("ReportTable with WhatsApp-Style Search Module and Responsive Layout", () => {
  it("renders table, WhatsApp-style filter chips, and desktop search panel toggle button", () => {
    render(
      <ReportTable
        columns={mockColumns}
        data={mockData}
        searchPanelFields={mockSearchPanelFields}
        rowKey={(r) => r.id}
      />
    );

    // Verify toggle button is hidden on mobile (has hidden lg:flex)
    const toggleBtn = screen.getByText("HIDE SEARCH PANEL").closest("button");
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveClass("hidden", "lg:flex");

    // Verify Search Panel Header on desktop
    expect(screen.getByRole("heading", { name: "Search" })).toBeInTheDocument();

    // Verify WhatsApp-style search category chips
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sale/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exchange/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Service/i })).toBeInTheDocument();

    // All 3 rows rendered
    expect(screen.getByText("Rajesh Sharma")).toBeInTheDocument();
    expect(screen.getByText("Anita Verma")).toBeInTheDocument();
    expect(screen.getByText("Vikram Singh")).toBeInTheDocument();
  });

  it("filters table data when clicking WhatsApp-style filter chips", () => {
    render(
      <ReportTable
        columns={mockColumns}
        data={mockData}
        searchPanelFields={mockSearchPanelFields}
        rowKey={(r) => r.id}
      />
    );

    // Click "Exchange" chip
    const exchangeChip = screen.getByRole("button", { name: /Exchange/i });
    fireEvent.click(exchangeChip);

    // Only Anita Verma (Exchange) should be visible
    expect(screen.getByText("Anita Verma")).toBeInTheDocument();
    expect(screen.queryByText("Rajesh Sharma")).not.toBeInTheDocument();
    expect(screen.queryByText("Vikram Singh")).not.toBeInTheDocument();

    // Click "All" to reset
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Rajesh Sharma")).toBeInTheDocument();
    expect(screen.getByText("Anita Verma")).toBeInTheDocument();
    expect(screen.getByText("Vikram Singh")).toBeInTheDocument();
  });

  it("filters table data using WhatsApp universal live search input", () => {
    render(
      <ReportTable
        columns={mockColumns}
        data={mockData}
        searchPanelFields={mockSearchPanelFields}
        searchFields={["customer_name", "invoice_number"]}
        rowKey={(r) => r.id}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search records...");
    fireEvent.change(searchInput, { target: { value: "Vikram" } });

    // Only Vikram Singh is visible
    expect(screen.getByText("Vikram Singh")).toBeInTheDocument();
    expect(screen.queryByText("Rajesh Sharma")).not.toBeInTheDocument();
    expect(screen.queryByText("Anita Verma")).not.toBeInTheDocument();
  });

  it("filters table data when entering values into desktop search panel fields", () => {
    render(
      <ReportTable
        columns={mockColumns}
        data={mockData}
        searchPanelFields={mockSearchPanelFields}
        rowKey={(r) => r.id}
      />
    );

    // Search by Ent. No using placeholder
    const entInput = screen.getByPlaceholderText("Filter Ent No");
    fireEvent.change(entInput, { target: { value: "INV-1001" } });

    // Only Rajesh Sharma is visible
    expect(screen.getByText("Rajesh Sharma")).toBeInTheDocument();
    expect(screen.queryByText("Anita Verma")).not.toBeInTheDocument();
    expect(screen.queryByText("Vikram Singh")).not.toBeInTheDocument();
  });

  it("toggles Search Panel visibility when HIDE / SHOW SEARCH PANEL is clicked on desktop", () => {
    render(
      <ReportTable
        columns={mockColumns}
        data={mockData}
        searchPanelFields={mockSearchPanelFields}
        rowKey={(r) => r.id}
      />
    );

    const toggleBtn = screen.getByText("HIDE SEARCH PANEL");
    fireEvent.click(toggleBtn);

    // Search panel is now hidden, button says SHOW SEARCH PANEL
    expect(screen.getByText("SHOW SEARCH PANEL")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Search" })).not.toBeInTheDocument();

    // Toggle back
    fireEvent.click(screen.getByText("SHOW SEARCH PANEL"));
    expect(screen.getByRole("heading", { name: "Search" })).toBeInTheDocument();
  });
});

describe("ReportTable responsive layout (horizontal scroll + mobile cards)", () => {
  const originalWidth = window.innerWidth;

  function setViewportWidth(width: number) {
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
  }

  afterEach(() => {
    setViewportWidth(originalWidth);
  });

  it("gives the desktop table a minimum width inside a horizontally scrollable container", () => {
    setViewportWidth(1280);
    render(<ReportTable columns={mockColumns} data={mockData} minTableWidth={900} />);

    const scroller = screen.getByTestId("report-table-scroll");
    expect(scroller.className).toContain("overflow-x-auto");

    const table = screen.getByRole("table");
    expect(table).toHaveStyle({ minWidth: "900px" });
    expect(screen.queryByTestId("report-table-cards")).not.toBeInTheDocument();
  });

  it("renders stacked cards instead of a table on mobile widths", () => {
    setViewportWidth(390);
    render(<ReportTable columns={mockColumns} data={mockData} />);

    expect(screen.getByTestId("report-table-cards")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    // Every row becomes a card with labelled fields
    expect(screen.getByText("Rajesh Sharma")).toBeInTheDocument();
    expect(screen.getByText("Vikram Singh")).toBeInTheDocument();
    expect(screen.getAllByText("Customer Name")).toHaveLength(mockData.length);
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("places the action column in the card header on mobile", () => {
    setViewportWidth(390);
    const columns = [
      ...mockColumns,
      { key: "action", header: "Action", render: () => <button>Options</button> },
    ];
    render(<ReportTable columns={columns} data={mockData} />);

    expect(screen.getAllByRole("button", { name: "Options" })).toHaveLength(mockData.length);
    // "Action" label is not rendered as a field label in the card body
    expect(screen.queryByText("Action")).not.toBeInTheDocument();
  });

  it("keeps the table when mobileCards is disabled, even on mobile widths", () => {
    setViewportWidth(390);
    render(<ReportTable columns={mockColumns} data={mockData} mobileCards={false} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByTestId("report-table-cards")).not.toBeInTheDocument();
  });
});
