import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CircleLoader, PageLoader } from "./CircleLoader";
import { BatteryLoader } from "./BatteryLoader";

describe("CircleLoader Component", () => {
    it("renders small inline circular loader without crash", () => {
        const { container } = render(<CircleLoader size="sm" />);
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveClass("animate-spin");
    });

    it("renders medium circular loader with custom loading text", () => {
        render(<CircleLoader size="md" text="Processing Payment..." />);
        expect(screen.getByText("Processing Payment...")).toBeInTheDocument();
    });

    it("renders PageLoader with default text", () => {
        render(<PageLoader text="Loading Dashboard..." />);
        expect(screen.getByText("Loading Dashboard...")).toBeInTheDocument();
    });

    it("renders BatteryLoader full-screen modal with text", () => {
        render(<BatteryLoader text="Authenticating User..." />);
        expect(screen.getByText("Authenticating User...")).toBeInTheDocument();
    });
});
