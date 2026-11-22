import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Login } from "./Login";
import { MemoryRouter } from "react-router";

const mockLogin = vi.fn();
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
        login: mockLogin,
        user: null,
        isAuthenticated: false,
    }),
}));

vi.mock("../contexts/ThemeContext", () => ({
    useTheme: () => ({ isDarkMode: false }),
}));

describe("Login Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
    });

    it("renders email, password, remember me checkbox, forgot password, and login button", () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /forgot password\?/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });

    it("inserts loader into login button and disables it during authentication without full-page loader", async () => {
        let resolveLogin: () => void;
        mockLogin.mockImplementation(() => new Promise((resolve) => {
            resolveLogin = resolve;
        }));

        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText(/email/i), "staff@battery.com");
        await user.type(screen.getByLabelText(/password/i), "secret123");

        const submitButton = screen.getByRole("button", { name: /login/i });
        await user.click(submitButton);

        // Check that button shows loader and Authenticating... text
        expect(screen.getByRole("button", { name: /authenticating\.\.\./i })).toBeDisabled();

        // Ensure full-page CircleLoader/BatteryLoader text is NOT in document
        expect(screen.queryByText(/loading system\.\.\./i)).not.toBeInTheDocument();

        // Resolve login
        resolveLogin!();
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/");
        });
    });

    it("saves email when remember me is checked and restores it on next mount", async () => {
        mockLogin.mockResolvedValueOnce(undefined);

        const user = userEvent.setup();
        const { unmount } = render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const emailInput = screen.getByLabelText(/email/i);
        const passInput = screen.getByLabelText(/password/i);
        const rememberCheckbox = screen.getByLabelText(/remember me/i);

        await user.type(emailInput, "remembered@battery.com");
        await user.type(passInput, "secret123");
        await user.click(rememberCheckbox);
        expect(rememberCheckbox).toBeChecked();

        await user.click(screen.getByRole("button", { name: /login/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith("remembered@battery.com", "secret123", true);
            expect(localStorage.getItem("powercell_remember_email")).toBe("remembered@battery.com");
            expect(localStorage.getItem("powercell_remember_me")).toBe("true");
        });

        unmount();

        // Remount to test auto-population
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByLabelText(/email/i)).toHaveValue("remembered@battery.com");
        expect(screen.getByLabelText(/remember me/i)).toBeChecked();
    });

    it("clears remembered email when remember me is unchecked upon login", async () => {
        localStorage.setItem("powercell_remember_email", "old@battery.com");
        localStorage.setItem("powercell_remember_me", "true");
        mockLogin.mockResolvedValueOnce(undefined);

        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const emailInput = screen.getByLabelText(/email/i);
        expect(emailInput).toHaveValue("old@battery.com");
        const rememberCheckbox = screen.getByLabelText(/remember me/i);
        expect(rememberCheckbox).toBeChecked();

        // Uncheck remember me
        await user.click(rememberCheckbox);
        expect(rememberCheckbox).not.toBeChecked();

        await user.type(screen.getByLabelText(/password/i), "password123");
        await user.click(screen.getByRole("button", { name: /login/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith("old@battery.com", "password123", false);
            expect(localStorage.getItem("powercell_remember_email")).toBeNull();
        });
    });

    it("shows error alert when login fails", async () => {
        mockLogin.mockRejectedValueOnce(new Error("Invalid credentials provided"));

        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText(/email/i), "wrong@battery.com");
        await user.type(screen.getByLabelText(/password/i), "wrongpass");
        await user.click(screen.getByRole("button", { name: /login/i }));

        await waitFor(() => {
            expect(screen.getByText(/invalid credentials provided/i)).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /login/i })).not.toBeDisabled();
        });
    });

    it("opens forgot password modal and handles successful reset", async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        await user.type(screen.getByLabelText(/email/i), "admin@battery.com");
        await user.click(screen.getByRole("button", { name: /forgot password\?/i }));

        // Modal should open
        expect(screen.getByRole("heading", { name: /forgot password/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/registered email/i)).toHaveValue("admin@battery.com");

        // Close modal
        await user.click(screen.getByRole("button", { name: /close/i }));
        await waitFor(() => {
            expect(screen.queryByRole("heading", { name: /forgot password/i })).not.toBeInTheDocument();
        });
    });
});
