import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Settings } from "./Settings";
import { DeveloperProvider } from "../contexts/DeveloperContext";
import { ThemeProvider } from "../contexts/ThemeContext";

let mockRole = "admin";

vi.mock("../contexts/AuthContext", () => ({
    useAuth: () => ({ user: { id: 1, name: "Test", role: mockRole } }),
}));

vi.mock("../components/PushNotificationManager", () => ({
    PushNotificationManager: () => <div data-testid="push-manager" />,
}));

function renderSettings() {
    return render(
        <DeveloperProvider>
            <ThemeProvider>
                <Settings />
            </ThemeProvider>
        </DeveloperProvider>
    );
}

describe("Settings page - Service Log ID prefix & Dark Mode", () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        mockRole = "admin";
    });

    it("shows the Service Configuration card with prefix input for admins", () => {
        renderSettings();
        expect(screen.getByRole("heading", { name: /Service Configuration/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/^Prefix$/i)).toBeInTheDocument();
    });

    it("hides the Service Configuration card for non-admin roles", () => {
        mockRole = "staff";
        renderSettings();
        expect(screen.queryByRole("heading", { name: /Service Configuration/i })).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/^Prefix$/i)).not.toBeInTheDocument();
    });

    it("toggles dark theme on the document and persists preference from Settings", () => {
        renderSettings();

        const toggle = screen.getByRole("switch", { name: /Toggle Dark Mode/i });
        expect(toggle).toHaveAttribute("aria-checked", "false");
        expect(screen.getByText(/Light theme enabled/i)).toBeInTheDocument();
        expect(document.documentElement.classList.contains("dark")).toBe(false);

        fireEvent.click(toggle);

        expect(toggle).toHaveAttribute("aria-checked", "true");
        expect(screen.getByText(/Dark theme enabled/i)).toBeInTheDocument();
        expect(document.documentElement.classList.contains("dark")).toBe(true);
        expect(document.documentElement.style.colorScheme).toBe("dark");
        expect(localStorage.getItem("powercell_dark_mode")).toBe("true");

        fireEvent.click(toggle);

        expect(toggle).toHaveAttribute("aria-checked", "false");
        expect(document.documentElement.classList.contains("dark")).toBe(false);
        expect(localStorage.getItem("powercell_dark_mode")).toBe("false");
    });
});
