import { Outlet, useNavigate } from "react-router";
import { LogOut, Code2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function DeveloperLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Developer Header */}
            <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-20 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center">
                        <Code2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-gray-900 text-lg">PowerCell Pro - Developer Console</span>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4 ml-auto">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-gray-900">{user?.name || 'Developer'}</p>
                        <p className="text-xs font-medium text-gray-500">{user?.email || 'dev@example.com'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:block">Exit Workspace</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="py-4 text-center border-t border-gray-200 mt-auto bg-white">
                <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">System Control Workspace • Build v2.0</p>
            </footer>
        </div>
    );
}
