import { useDeveloper } from "../contexts/DeveloperContext";
import { useTheme } from "../contexts/ThemeContext";
import { Settings, Edit2, ShieldCheck, ToggleLeft, ToggleRight, Moon, Sun } from "lucide-react";

export function DeveloperSettings() {
    const { features, toggleFeature } = useDeveloper();
    const { isDarkMode, toggleDarkMode } = useTheme();

    return (
        <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase">Developer Mode</h1>
                    <p className="text-sm font-medium text-gray-500">Feature Toggle Management</p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100">
                    <Settings className="w-6 h-6 text-purple-600" />
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-purple-600" />
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Available Modules</h2>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Toggle: Edit Profile */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                <Edit2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Profile Editing Module</h3>
                                <p className="text-xs text-gray-500">Allow users to modify their personal info</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleFeature('editProfile')}
                            className="text-gray-400 hover:text-purple-600 transition-colors"
                        >
                            {features.editProfile ? (
                                <ToggleRight className="w-10 h-10 text-purple-600" />
                            ) : (
                                <ToggleLeft className="w-10 h-10" />
                            )}
                        </button>
                    </div>

                    {/* Toggle: Sales History Module */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Sales History Module</h3>
                                <p className="text-xs text-gray-500">Allow Admin to view Battery Sales History</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleFeature('salesHistory')}
                            className="text-gray-400 hover:text-purple-600 transition-colors"
                        >
                            {features.salesHistory ? (
                                <ToggleRight className="w-10 h-10 text-purple-600" />
                            ) : (
                                <ToggleLeft className="w-10 h-10" />
                            )}
                        </button>
                    </div>

                    {/* Toggle: Dark Mode Module */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                <Moon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Dark Mode Module</h3>
                                <p className="text-xs text-gray-500">Allow Admin/Staff to toggle Dark Mode</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleFeature('darkMode')}
                            className="text-gray-400 hover:text-purple-600 transition-colors"
                        >
                            {features.darkMode ? (
                                <ToggleRight className="w-10 h-10 text-purple-600" />
                            ) : (
                                <ToggleLeft className="w-10 h-10" />
                            )}
                        </button>
                    </div>

                    {/* Toggle: Contact Actions Module */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Contact Actions Module</h3>
                                <p className="text-xs text-gray-500">Enable WhatsApp & Call buttons on inputs</p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleFeature('enableContactActions')}
                            className="text-gray-400 hover:text-purple-600 transition-colors"
                        >
                            {features.enableContactActions ? (
                                <ToggleRight className="w-10 h-10 text-purple-600" />
                            ) : (
                                <ToggleLeft className="w-10 h-10" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Developer's Personal Preferences */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden mt-6">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Personal Workspace</h2>
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-500'}`}>
                                {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Developer Dark Mode</h3>
                                <p className="text-xs text-gray-500">Enable dark theme for console</p>
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


        </div>
    );
}
