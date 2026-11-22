import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { User, Lock, ArrowRight, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { ForgotPasswordModal } from "../components/auth/ForgotPasswordModal";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("powercell_remember_email");
    const savedRemember = localStorage.getItem("powercell_remember_me");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(savedRemember !== "false");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessNotice("");

    try {
      await login(email, password, rememberMe);
      if (rememberMe) {
        localStorage.setItem("powercell_remember_email", email);
        localStorage.setItem("powercell_remember_me", "true");
      } else {
        localStorage.removeItem("powercell_remember_email");
        localStorage.removeItem("powercell_remember_me");
      }
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetSuccess = (resetEmail: string) => {
    setEmail(resetEmail);
    setPassword("");
    setError("");
    setSuccessNotice("Password has been reset successfully! Please log in with your new password.");
    setIsForgotPasswordOpen(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-500 relative overflow-hidden ${isDarkMode
      ? "bg-[#0f172a]"
      : "bg-gradient-to-br from-blue-50 via-white to-green-50"
      }`}>
      {/* Background Decorative Elements */}
      {isDarkMode && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </>
      )}

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-4 p-1 overflow-hidden bg-black shadow-xl ring-4 ring-white/10">
            <img src="smr.jpeg" alt="SMR Battery Shop Logo" className="w-full h-full object-cover rounded-2xl" />
          </div>
          <h1 className={`text-3xl font-black tracking-tight mb-1 uppercase ${isDarkMode ? "text-[#ffffff]" : "text-gray-900"}`}>
            SMR <span className="text-green-500">BATTERY SHOP</span>
          </h1>
          <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Powering Your Journey
          </p>
        </div>

        {/* Login Card */}
        <div className={`rounded-[2.5rem] p-10 border transition-all duration-500 ${isDarkMode
            ? "bg-white/5 backdrop-blur-xl border-white/10"
            : "bg-white border-gray-100"
          }`}>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-2xl text-center font-bold animate-shake">
                {error}
              </div>
            )}

            {successNotice && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm rounded-2xl text-center font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className={`block text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-[#ffffff]" : "text-gray-600"}`}>
                Email
              </label>
              <div className="relative group">
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isDarkMode ? "text-gray-400 group-focus-within:text-blue-400" : "text-gray-400 group-focus-within:text-blue-600"}`} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@powercell.pro"
                  className={`pl-12 h-14 rounded-2xl border-2 transition-all ${isDarkMode
                    ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-blue-500/50 text-[#ffffff] placeholder:text-gray-500"
                    : "bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-600 text-gray-900 placeholder:text-gray-400"
                    }`}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className={`block text-xs font-black uppercase tracking-widest ${isDarkMode ? "text-[#ffffff]" : "text-gray-600"}`}>
                Password
              </label>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isDarkMode ? "text-gray-400 group-focus-within:text-blue-400" : "text-gray-400 group-focus-within:text-blue-600"}`} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`pl-12 pr-12 h-14 rounded-2xl border-2 transition-all ${isDarkMode
                    ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-blue-500/50 text-[#ffffff] placeholder:text-gray-500"
                    : "bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-600 text-gray-900 placeholder:text-gray-400"
                    }`}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password Row */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label htmlFor="remember-me" className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-white/20 dark:bg-white/5 dark:focus:ring-blue-400 cursor-pointer"
                />
                <span className={`font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                disabled={loading}
                className="font-bold text-xs uppercase tracking-wider text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button with Inline Loader */}
            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${isDarkMode
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                : "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 space-y-2 animate-in fade-in duration-1000">
          <div className="flex justify-center gap-4">
            <div className="w-1 h-1 rounded-full bg-blue-500/40"></div>
            <div className="w-1 h-1 rounded-full bg-blue-500/40"></div>
            <div className="w-1 h-1 rounded-full bg-blue-500/40"></div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={email}
        onSuccess={handlePasswordResetSuccess}
      />
    </div>
  );
}
