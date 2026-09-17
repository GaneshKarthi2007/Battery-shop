import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WarrantyManagement } from "./WarrantyManagement";
import { MemoryRouter } from "react-router";

vi.mock("../api/client", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue([
      {
        id: 1,
        claim_number: "CLM-1001",
        serial_number: "EX-98765",
        customer_name: "Kumar",
        customer_phone: "9876543210",
        issue_description: "Dead cell",
        claim_type: "replacement",
        status: "pending_inspection",
        created_at: new Date().toISOString(),
      },
    ]),
    post: vi.fn().mockResolvedValue({ id: 2 }),
    put: vi.fn().mockResolvedValue({ id: 1, status: "approved" }),
  },
}));

describe("WarrantyManagement Component", () => {
  it("renders page header and serial warranty checker", async () => {
    render(
      <MemoryRouter>
        <WarrantyManagement />
      </MemoryRouter>
    );

    expect(screen.getByText(/Warranty Management & Claims/i)).toBeInTheDocument();
    expect(screen.getByText(/Instant Serial Number Warranty Checker/i)).toBeInTheDocument();
  });
});
