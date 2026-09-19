import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CustomerHistory } from "./CustomerHistory";
import { MemoryRouter } from "react-router";

vi.mock("../api/client", () => ({
  apiClient: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes('/customers/')) {
        return Promise.resolve({
          profile: {
            name: "Kumar",
            phone: "9876543210",
            vehicle_number: "TN-37-AB-1234",
            total_purchases: 42500,
            total_outstanding: 4500,
            batteries_purchased: 6,
            exchanges_count: 2,
            services_count: 3,
            claims_count: 1,
          },
          sales: [],
          services: [],
          exchanges: [],
          warranty_claims: [],
        });
      }
      return Promise.resolve([
        {
          name: "Kumar",
          phone: "9876543210",
          total_purchases: 42500,
          total_outstanding: 4500,
          total_sales_count: 4,
          batteries_purchased: 6,
          exchanges_count: 2,
          services_count: 3,
          claims_count: 1,
        }
      ]);
    }),
  },
}));

describe("CustomerHistory Component", () => {
  it("renders customer directory and profile summary header", async () => {
    render(
      <MemoryRouter>
        <CustomerHistory />
      </MemoryRouter>
    );

    expect(screen.getByText(/Customer Profiles & History/i)).toBeInTheDocument();
  });
});
