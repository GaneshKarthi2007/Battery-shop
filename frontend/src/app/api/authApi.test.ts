import { describe, it, expect, vi, beforeEach } from "vitest";
import { authApi } from "./authApi";

describe("authApi", () => {
    beforeEach(() => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ message: "Success" }),
            })
        );
    });

    it("forgotPassword sends POST to /forgot-password with email", async () => {
        const res = await authApi.forgotPassword("user@example.com");
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("/forgot-password"),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ email: "user@example.com" }),
            })
        );
        expect(res).toEqual({ message: "Success" });
    });

    it("resetPassword sends POST to /reset-password with credentials", async () => {
        const res = await authApi.resetPassword("user@example.com", "123456", "newpass123", "newpass123");
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("/reset-password"),
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    email: "user@example.com",
                    token: "123456",
                    password: "newpass123",
                    password_confirmation: "newpass123",
                }),
            })
        );
        expect(res).toEqual({ message: "Success" });
    });
});
