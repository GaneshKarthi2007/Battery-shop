import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { BatterySales } from "./BatterySales";
import { apiClient } from "../api/client";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
    const actual = await vi.importActual("react-router");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("../api/client", () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
    BASE_URL: "http://localhost:8000/api",
}));

vi.mock("../contexts/AuthContext", () => ({
    useAuth: () => ({
        user: { id: 2, name: "Staff Member", role: "staff" },
    }),
}));

const mockProducts = [
    {
        id: 10,
        brand: "Exide",
        model: "InvaTubular IT500",
        ah: "150",
        type: "Inverter",
        price: 12000,
        warranty: "60 Months",
        stock: 5,
    },
    {
        id: 11,
        brand: "Amaron",
        model: "PRO 55B24L",
        ah: "45",
        type: "Car",
        price: 6200,
        warranty: "48 Months",
        stock: 10,
    },
    {
        id: 12,
        brand: "Luminous",
        model: "ILTT 18048",
        ah: "150",
        type: "Inverter",
        price: 14500,
        warranty: "48 Months",
        stock: 8,
    },
];

describe("BatterySales Component (E-com 3xN Grid & Mobile Top Cart Bar)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        (apiClient.get as any).mockResolvedValue(mockProducts);
    });

    it("redirects staff back to assigned jobs when opened directly without fromService state", async () => {
        render(
            <MemoryRouter initialEntries={["/sales"]}>
                <Routes>
                    <Route path="/sales" element={<BatterySales />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/assigned-jobs", { replace: true });
        });
    });

    it("renders 3xN e-commerce product grid with brand-based product images and mobile top cart bar navigation", async () => {
        render(
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: "/sales",
                        state: {
                            fromService: true,
                            isNewConnection: true,
                            serviceId: 5,
                            customerInfo: { name: "Karthik Nair", phone: "9876543299", address: "12 MG Road" },
                        },
                    },
                ]}
            >
                <Routes>
                    <Route path="/sales" element={<BatterySales />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("New Connection — Product Billing")).toBeInTheDocument();
            expect(screen.getByText("Exide")).toBeInTheDocument();
        });

        // 3xN product grid layout
        const grid = screen.getByTestId("product-grid");
        expect(grid).toHaveClass("grid", "grid-cols-3");

        // Brand-based internet product images
        const exideImg = screen.getByAltText("Exide InvaTubular IT500") as HTMLImageElement;
        const amaronImg = screen.getByAltText("Amaron PRO 55B24L") as HTMLImageElement;
        expect(exideImg.src).toMatch(/^https:\/\//);
        expect(amaronImg.src).toMatch(/^https:\/\//);
        expect(exideImg.src).not.toBe(amaronImg.src);

        // Mobile top floating cart bar exists
        const topBar = screen.getByTestId("mobile-top-cart-bar");
        expect(topBar).toBeInTheDocument();

        // Add first product
        const addButtons = screen.getAllByRole("button", { name: /^Add$/i });
        fireEvent.click(addButtons[0]);

        // Open mobile cart drawer via top floating bar Cart navigation icon
        fireEvent.click(screen.getByRole("button", { name: /Open Cart/i }));
        expect(screen.getByTestId("mobile-cart-drawer")).toBeInTheDocument();

        // Proceed to Checkout from cart
        const proceedBtns = screen.getAllByRole("button", { name: /Proceed to Billing/i });
        fireEvent.click(proceedBtns[0]);

        expect(mockNavigate).toHaveBeenCalledWith(
            "/checkout",
            expect.objectContaining({
                state: expect.objectContaining({
                    fromService: true,
                    isNewConnection: true,
                    serviceId: 5,
                }),
            })
        );
    });
});
