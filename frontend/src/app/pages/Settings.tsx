import { useTheme } from "../contexts/ThemeContext";
import { useDeveloper } from "../contexts/DeveloperContext";
import { useAuth } from "../contexts/AuthContext";
import { Settings as SettingsIcon, Moon, Sun } from "lucide-react";
import { PushNotificationManager } from "../components/PushNotificationManager";
import { ServiceLogIdPrefixSetting } from "../components/service/ServiceLogIdPrefixSetting";

export function Settings() {
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { features } = useDeveloper();
    const { user } = useAuth();

    return (
        <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase">Settings</h1>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Manage your system preferences</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 dark:bg-[#161D30] rounded-2xl flex items-center justify-center border border-gray-200 dark:border-[#25314D]">
                    <SettingsIcon className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                </div>
            </div>

            <div className="space-y-6">
                {/* Appearance Module - ONLY render if Developer enabled it */}
                {features.darkMode && (
                    <div className="bg-white dark:bg-[#0D121F] rounded-[2rem] border border-gray-100 dark:border-[#25314D] overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-100 dark:border-[#25314D] bg-gradient-to-r from-gray-50 to-white dark:from-[#161D30] dark:to-[#0D121F]">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Appearance</h2>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-[#161D30] rounded-2xl border border-gray-200 dark:border-[#25314D]">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-100 text-orange-500'}`}>
                                        {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">Dark Mode</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isDarkMode}
                                    aria-label="Toggle Dark Mode"
                                    onClick={(e) => toggleDarkMode(e)}
                                    className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                                >
                                    <span
                                        data-preserve-light="true"
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${isDarkMode ? 'translate-x-8' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Service Configuration - admins only */}
                {user?.role === 'admin' && (
                    <div className="bg-white dark:bg-[#0D121F] rounded-[2rem] border border-gray-100 dark:border-[#25314D] overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-100 dark:border-[#25314D] bg-gradient-to-r from-gray-50 to-white dark:from-[#161D30] dark:to-[#0D121F]">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Service Configuration</h2>
                        </div>
                        <div className="p-6">
                            <ServiceLogIdPrefixSetting accent="blue" />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6">
                <PushNotificationManager />
            </div>

            <div className="mt-8 space-y-4">


                <div className="text-center text-xs font-bold text-gray-400 capitalize tracking-widest">
                    Account Role: {user?.role}
                </div>
            </div>
        </div>
    );
}
