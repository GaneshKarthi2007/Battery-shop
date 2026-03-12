import { useState } from "react";
import { useNavigate } from "react-router";
import { Zap, User, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { BatteryLoader } from "../components/ui/BatteryLoader";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
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

      {loading && <BatteryLoader />}

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl mb-6 shadow-2xl shadow-blue-500/20 ring-4 ring-white/10">
            <Zap className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className={`text-4xl font-black tracking-tight mb-2 ${isDarkMode ? "text-[#ffffff]" : "text-gray-900"}`}>
            PowerCell <span className="text-blue-500">Pro</span>
          </h1>
          <p className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Next-Gen Battery Management
          </p>
        </div>

        {/* Login Card */}
        <div className={`rounded-[2.5rem] shadow-2xl p-10 border transition-all duration-500 ${isDarkMode
            ? "bg-white/5 backdrop-blur-xl border-white/10 shadow-black/40"
            : "bg-white border-gray-100 shadow-blue-100/50"
          }`}>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-2xl text-center font-bold animate-shake">
                {error}
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

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 ${isDarkMode
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-blue-200 text-white"
                }`}
            >
              <span>{loading ? "Authenticating..." : "Login"}</span>
              {!loading && <ArrowRight className="w-5 h-5" />}
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
    </div>
  );
}
