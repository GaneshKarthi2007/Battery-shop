import { useTheme } from "../contexts/ThemeContext";
import { useDeveloper } from "../contexts/DeveloperContext";
import { useAuth } from "../contexts/AuthContext";
import { Settings as SettingsIcon, Moon, Sun } from "lucide-react";

export function Settings() {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { features } = useDeveloper();
    const { user } = useAuth();

    return (
        <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase">Settings</h1>
                    <p className="text-sm font-medium text-gray-500">Manage your system preferences</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
                    <SettingsIcon className="w-6 h-6 text-gray-700" />
                </div>
            </div>

            <div className="space-y-6">
                {/* Appearance Module - ONLY render if Developer enabled it */}
                {features.darkMode && (
                    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Appearance</h2>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-500'}`}>
                                        {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Dark Mode</h3>
                                        <p className="text-xs text-gray-500">Toggle dark mode interface</p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleDarkMode}
                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-8' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 space-y-4">


                <div className="text-center text-xs font-bold text-gray-400 capitalize tracking-widest">
                    Account Role: {user?.role}
                </div>
            </div>
        </div>
    );
}
