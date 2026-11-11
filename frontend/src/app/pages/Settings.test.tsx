import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Settings } from "./Settings";
import { DeveloperProvider } from "../contexts/DeveloperContext";

let mockRole = "admin";

vi.mock("../contexts/AuthContext", () => ({
    useAuth: () => ({ user: { id: 1, name: "Test", role: mockRole } }),
}));

vi.mock("../contexts/ThemeContext", () => ({
    useTheme: () => ({ isDarkMode: false, toggleDarkMode: vi.fn() }),
}));

vi.mock("../components/PushNotificationManager", () => ({
    PushNotificationManager: () => <div data-testid="push-manager" />,
}));

function renderSettings() {
    return render(
        <DeveloperProvider>
            <Settings />
        </DeveloperProvider>
    );
}

describe("Settings page - Service Log ID prefix", () => {
    beforeEach(() => {
        localStorage.clear();
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
});
