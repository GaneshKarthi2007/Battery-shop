import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeveloperSettings } from "./DeveloperSettings";
import { DeveloperProvider } from "../contexts/DeveloperContext";

vi.mock("react-router", async () => {
    const actual = await vi.importActual("react-router");
    return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock("../contexts/ThemeContext", () => ({
    useTheme: () => ({ isDarkMode: false, toggleDarkMode: vi.fn() }),
}));

describe("DeveloperSettings - Service Log ID prefix", () => {
    beforeEach(() => localStorage.clear());

    it("renders the Service Log ID Prefix setting for the developer", () => {
        render(
            <DeveloperProvider>
                <DeveloperSettings />
            </DeveloperProvider>
        );
        expect(screen.getByRole("heading", { name: /Service Log ID Prefix/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/^Prefix$/i)).toBeInTheDocument();
    });
});
