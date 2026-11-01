import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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

describe("ReportTable with Search Panel (Reference Layout)", () => {
  it("renders table, HIDE SEARCH PANEL button and Search panel with typed fields", () => {
    render(
      <ReportTable
        columns={mockColumns}
        data={mockData}
        searchPanelFields={mockSearchPanelFields}
        rowKey={(r) => r.id}
      />
    );

    // Verify toggle button
    expect(screen.getByText("HIDE SEARCH PANEL")).toBeInTheDocument();

    // Verify Search Panel Header
    expect(screen.getByRole("heading", { name: "Search" })).toBeInTheDocument();

    // Verify floating labels from reference image
    expect(screen.getByText("Ent. No")).toBeInTheDocument();
    expect(screen.getByText("Entry Date")).toBeInTheDocument();
    expect(screen.getByText("Party Name")).toBeInTheDocument();
    expect(screen.getByText("Status / Type")).toBeInTheDocument();

    // All 3 rows rendered
    expect(screen.getByText("Rajesh Sharma")).toBeInTheDocument();
    expect(screen.getByText("Anita Verma")).toBeInTheDocument();
    expect(screen.getByText("Vikram Singh")).toBeInTheDocument();
  });

  it("filters table data when entering values into typed search panel fields", () => {
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

  it("toggles Search Panel visibility when HIDE / SHOW SEARCH PANEL is clicked", () => {
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
