import { useState, useEffect } from "react";
import { KeyRound, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, X, CheckCircle2 } from "lucide-react";
import { Button } from "../Button";
import { Input } from "../Input";
import { authApi } from "../../api/authApi";
import { useTheme } from "../../contexts/ThemeContext";

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialEmail?: string;
    onSuccess: (email: string) => void;
}

export function ForgotPasswordModal({
    isOpen,
    onClose,
    initialEmail = "",
    onSuccess,
}: ForgotPasswordModalProps) {
    const { isDarkMode } = useTheme();
    const [step, setStep] = useState<"request" | "reset">("request");
    const [email, setEmail] = useState(initialEmail);
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [infoMessage, setInfoMessage] = useState("");
    const [debugToken, setDebugToken] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setEmail(initialEmail);
            setStep("request");
            setToken("");
            setPassword("");
            setPasswordConfirmation("");
            setError("");
            setInfoMessage("");
            setDebugToken(null);
            setShowPassword(false);
        }
    }, [isOpen, initialEmail]);

    if (!isOpen) return null;

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setInfoMessage("");
        setLoading(true);

        try {
            const res = await authApi.forgotPassword(email);
            setInfoMessage(res.message || "A reset code has been sent to your email.");
            if (res.debug_token) {
                setDebugToken(res.debug_token);
                setToken(res.debug_token);
            }
            setStep("reset");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to send reset code. Please check your email.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== passwordConfirmation) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await authApi.resetPassword(email, token, password, passwordConfirmation);
            onSuccess(email);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to reset password. Please check your reset code.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError("");
        setLoading(true);
        try {
            const res = await authApi.forgotPassword(email);
            setInfoMessage(res.message || "A new reset code has been sent.");
            if (res.debug_token) {
                setDebugToken(res.debug_token);
                setToken(res.debug_token);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to resend reset code.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className={`w-full max-w-md rounded-[2.5rem] p-8 border shadow-2xl relative transition-all duration-300 animate-in zoom-in-95 duration-200 ${
                    isDarkMode
                        ? "bg-[#0f172a] border-white/10 text-white"
                        : "bg-white border-gray-100 text-gray-900"
                }`}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-6 top-6 p-2 rounded-full text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors focus:outline-none"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Icon & Title */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 bg-blue-600/10 text-blue-500 ring-4 ring-blue-500/20">
                        <KeyRound className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight">
                        {step === "request" ? "Forgot Password" : "Reset Password"}
                    </h2>
                    <p className={`text-xs font-semibold mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {step === "request"
                            ? "Enter your registered email to receive a reset code"
                            : "Enter the verification code and your new password"}
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-2xl text-center">
                        {error}
                    </div>
                )}

                {infoMessage && (
                    <div className="mb-4 p-3.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-500" />
                        <span>{infoMessage}</span>
                    </div>
                )}

                {debugToken && step === "reset" && (
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold rounded-2xl text-center flex items-center justify-between">
                        <span>Demo Code: <strong>{debugToken}</strong></span>
                        <button
                            type="button"
                            onClick={() => setToken(debugToken)}
                            className="text-[11px] underline uppercase tracking-wider hover:text-amber-400"
                        >
                            Auto-fill
                        </button>
                    </div>
                )}

                {/* Step 1: Request Reset Code */}
                {step === "request" ? (
                    <form onSubmit={handleRequestCode} className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="forgot-email"
                                className={`block text-xs font-black uppercase tracking-widest ${
                                    isDarkMode ? "text-white" : "text-gray-600"
                                }`}
                            >
                                Registered Email
                            </label>
                            <div className="relative group">
                                <Mail
                                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                                        isDarkMode
                                            ? "text-gray-400 group-focus-within:text-blue-400"
                                            : "text-gray-400 group-focus-within:text-blue-600"
                                    }`}
                                />
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@powercell.pro"
                                    className={`pl-12 h-14 rounded-2xl border-2 transition-all ${
                                        isDarkMode
                                            ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-blue-500/50 text-white placeholder:text-gray-500"
                                            : "bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-600 text-gray-900 placeholder:text-gray-400"
                                    }`}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
                                isDarkMode
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                            }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Sending Code...</span>
                                </>
                            ) : (
                                <>
                                    <span>Send Reset Code</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </Button>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                                    isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                                }`}
                            >
                                Back to Login
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Step 2: Reset Password Form */
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        {/* Token / Code Field */}
                        <div className="space-y-2">
                            <label
                                htmlFor="reset-token"
                                className={`block text-xs font-black uppercase tracking-widest ${
                                    isDarkMode ? "text-white" : "text-gray-600"
                                }`}
                            >
                                6-Digit Reset Code
                            </label>
                            <div className="relative group">
                                <KeyRound
                                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                                        isDarkMode
                                            ? "text-gray-400 group-focus-within:text-blue-400"
                                            : "text-gray-400 group-focus-within:text-blue-600"
                                    }`}
                                />
                                <Input
                                    id="reset-token"
                                    type="text"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.trim())}
                                    placeholder="Enter 6-digit code"
                                    className={`pl-12 h-14 rounded-2xl border-2 transition-all font-mono tracking-wider ${
                                        isDarkMode
                                            ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-blue-500/50 text-white placeholder:text-gray-500"
                                            : "bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-600 text-gray-900 placeholder:text-gray-400"
                                    }`}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* New Password Field */}
                        <div className="space-y-2">
                            <label
                                htmlFor="new-password"
                                className={`block text-xs font-black uppercase tracking-widest ${
                                    isDarkMode ? "text-white" : "text-gray-600"
                                }`}
                            >
                                New Password
                            </label>
                            <div className="relative group">
                                <Lock
                                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                                        isDarkMode
                                            ? "text-gray-400 group-focus-within:text-blue-400"
                                            : "text-gray-400 group-focus-within:text-blue-600"
                                    }`}
                                />
                                <Input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className={`pl-12 pr-12 h-14 rounded-2xl border-2 transition-all ${
                                        isDarkMode
                                            ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-blue-500/50 text-white placeholder:text-gray-500"
                                            : "bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-600 text-gray-900 placeholder:text-gray-400"
                                    }`}
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <label
                                htmlFor="confirm-password"
                                className={`block text-xs font-black uppercase tracking-widest ${
                                    isDarkMode ? "text-white" : "text-gray-600"
                                }`}
                            >
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <Lock
                                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                                        isDarkMode
                                            ? "text-gray-400 group-focus-within:text-blue-400"
                                            : "text-gray-400 group-focus-within:text-blue-600"
                                    }`}
                                />
                                <Input
                                    id="confirm-password"
                                    type={showPassword ? "text" : "password"}
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    placeholder="Re-enter password"
                                    className={`pl-12 pr-12 h-14 rounded-2xl border-2 transition-all ${
                                        isDarkMode
                                            ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-blue-500/50 text-white placeholder:text-gray-500"
                                            : "bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-600 text-gray-900 placeholder:text-gray-400"
                                    }`}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
                                isDarkMode
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                            }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Updating Password...</span>
                                </>
                            ) : (
                                <>
                                    <span>Reset Password</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </Button>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => setStep("request")}
                                className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                                    isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                                }`}
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Change Email</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={loading}
                                className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                            >
                                Resend Code
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
