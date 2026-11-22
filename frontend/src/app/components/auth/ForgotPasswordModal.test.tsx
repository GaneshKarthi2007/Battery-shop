import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { authApi } from "../../api/authApi";

vi.mock("../../api/authApi", () => ({
    authApi: {
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
    },
}));

vi.mock("../../contexts/ThemeContext", () => ({
    useTheme: () => ({ isDarkMode: false }),
}));

describe("ForgotPasswordModal Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not render when isOpen is false", () => {
        const { container } = render(
            <ForgotPasswordModal isOpen={false} onClose={vi.fn()} onSuccess={vi.fn()} />
        );
        expect(container.firstChild).toBeNull();
    });

    it("renders step 1 with pre-filled initialEmail and sends reset code", async () => {
        vi.mocked(authApi.forgotPassword).mockResolvedValueOnce({
            message: "Reset code sent successfully.",
            debug_token: "654321",
        });

        const user = userEvent.setup();
        render(
            <ForgotPasswordModal
                isOpen={true}
                onClose={vi.fn()}
                initialEmail="test@battery.com"
                onSuccess={vi.fn()}
            />
        );

        const emailInput = screen.getByLabelText(/registered email/i);
        expect(emailInput).toHaveValue("test@battery.com");

        const sendButton = screen.getByRole("button", { name: /send reset code/i });
        await user.click(sendButton);

        expect(authApi.forgotPassword).toHaveBeenCalledWith("test@battery.com");

        // Should advance to step 2
        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument();
            expect(screen.getByLabelText(/6-digit reset code/i)).toBeInTheDocument();
            expect(screen.getByText(/demo code:/i)).toBeInTheDocument();
        });
    });

    it("shows error when forgotPassword fails", async () => {
        vi.mocked(authApi.forgotPassword).mockRejectedValueOnce(new Error("Email not found"));

        const user = userEvent.setup();
        render(
            <ForgotPasswordModal
                isOpen={true}
                onClose={vi.fn()}
                initialEmail="wrong@battery.com"
                onSuccess={vi.fn()}
            />
        );

        await user.click(screen.getByRole("button", { name: /send reset code/i }));

        await waitFor(() => {
            expect(screen.getByText(/email not found/i)).toBeInTheDocument();
        });
    });

    it("validates password length and match in step 2", async () => {
        vi.mocked(authApi.forgotPassword).mockResolvedValueOnce({
            message: "Code sent",
            debug_token: "112233",
        });

        const user = userEvent.setup();
        render(
            <ForgotPasswordModal
                isOpen={true}
                onClose={vi.fn()}
                initialEmail="test@battery.com"
                onSuccess={vi.fn()}
            />
        );

        await user.click(screen.getByRole("button", { name: /send reset code/i }));
        await waitFor(() => screen.getByLabelText(/new password/i));

        const passInput = screen.getByLabelText(/^new password/i);
        const confirmInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole("button", { name: /reset password/i });

        // Short password
        await user.type(passInput, "123");
        await user.type(confirmInput, "123");
        await user.click(submitButton);
        expect(screen.getByText(/must be at least 6 characters/i)).toBeInTheDocument();

        // Mismatched password
        await user.clear(passInput);
        await user.clear(confirmInput);
        await user.type(passInput, "password123");
        await user.type(confirmInput, "password456");
        await user.click(submitButton);
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it("submits valid reset and invokes onSuccess callback", async () => {
        vi.mocked(authApi.forgotPassword).mockResolvedValueOnce({
            message: "Code sent",
            debug_token: "998877",
        });
        vi.mocked(authApi.resetPassword).mockResolvedValueOnce({
            message: "Password reset complete.",
        });

        const onSuccess = vi.fn();
        const user = userEvent.setup();
        render(
            <ForgotPasswordModal
                isOpen={true}
                onClose={vi.fn()}
                initialEmail="user@battery.com"
                onSuccess={onSuccess}
            />
        );

        await user.click(screen.getByRole("button", { name: /send reset code/i }));
        await waitFor(() => screen.getByLabelText(/new password/i));

        const tokenInput = screen.getByLabelText(/6-digit reset code/i);
        const passInput = screen.getByLabelText(/^new password/i);
        const confirmInput = screen.getByLabelText(/confirm password/i);

        await user.clear(tokenInput);
        await user.type(tokenInput, "998877");
        await user.type(passInput, "newPassword123");
        await user.type(confirmInput, "newPassword123");

        await user.click(screen.getByRole("button", { name: /reset password/i }));

        await waitFor(() => {
            expect(authApi.resetPassword).toHaveBeenCalledWith(
                "user@battery.com",
                "998877",
                "newPassword123",
                "newPassword123"
            );
            expect(onSuccess).toHaveBeenCalledWith("user@battery.com");
        });
    });
});
