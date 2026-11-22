import { apiClient } from "./client";

export interface ForgotPasswordResponse {
    message: string;
    debug_token?: string;
}

export interface ResetPasswordResponse {
    message: string;
}

export const authApi = {
    forgotPassword: (email: string) =>
        apiClient.post<ForgotPasswordResponse>('/forgot-password', { email }),

    resetPassword: (email: string, token: string, password: string, password_confirmation: string) =>
        apiClient.post<ResetPasswordResponse>('/reset-password', {
            email,
            token,
            password,
            password_confirmation,
        }),
};
