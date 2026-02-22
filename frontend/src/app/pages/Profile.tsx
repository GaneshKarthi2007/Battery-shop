import { useState } from "react";
import { User, Mail, Phone, MapPin, Camera, Edit2, Check, X, Store, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface UserProfile {
    name: string;
    role: string;
    email: string;
    phone: string;
    storeName: string;
    address: string;
    about: string;
}

export function Profile() {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile>({
        name: user?.name || "User",
        role: user?.role || "Staff",
        email: user?.email || "user@powercell.com",
        phone: "+91 98765 43210",
        storeName: "PowerCell Pro",
        address: "123, Storage Street, Industrial Area, Tech City - 400001",
        about: "Battery Shop Management System Member",
    });

    const [tempValue, setTempValue] = useState("");
    const [saving, setSaving] = useState(false);

    const startEditing = (field: keyof UserProfile) => {
        if (field === 'role') return; // Cannot edit role
        setIsEditing(field);
        setTempValue(profile[field]);
    };

    const saveEdit = async (field: keyof UserProfile) => {
        setSaving(true);
        try {
            // In a real app, this would be an API call
            // await apiClient.put('/user/profile', { [field]: tempValue });
            setProfile({ ...profile, [field]: tempValue });
            setIsEditing(null);
        } catch (err) {
            alert("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const cancelEdit = () => {
        setIsEditing(null);
        setTempValue("");
    };

    const EditInput = ({ field, label, icon: Icon, readonly = false }: { field: keyof UserProfile, label: string, icon: any, readonly?: boolean }) => (
        <div className="py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-4 -mx-4">
            <div className="flex items-start gap-4">
                <div className="mt-1 text-gray-400">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">{label}</p>

                    {isEditing === field && !readonly ? (
                        <div className="flex items-center gap-2 mt-1">
                            <input
                                type="text"
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                className="flex-1 p-2 border border-blue-500 rounded-lg outline-none text-gray-900 bg-white"
                                autoFocus
                                disabled={saving}
                            />
                            <button
                                onClick={() => saveEdit(field)}
                                disabled={saving}
                                className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div
                            className={`flex items-center justify-between group ${!readonly ? 'cursor-pointer' : ''}`}
                            onClick={() => !readonly && startEditing(field)}
                        >
                            <p className="text-gray-900 text-base font-semibold">{profile[field]}</p>
                            {!readonly && (
                                <button className="opacity-0 group-hover:opacity-100 p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {field === 'about' && !isEditing && (
                        <p className="text-xs text-gray-500 mt-1 italic">This name will be visible to your team and on documents.</p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-900 uppercase">My Profile</h1>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="relative h-48 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center group">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-2xl relative z-10 transition-transform group-hover:scale-105">
                        <div className="w-full h-full bg-white flex items-center justify-center text-blue-600">
                            <span className="text-5xl font-black">{profile.name.charAt(0)}</span>
                        </div>

                        <div className="absolute inset-0 bg-black/40 hidden group-hover:flex flex-col items-center justify-center cursor-pointer">
                            <Camera className="w-8 h-8 text-white mb-1" />
                            <p className="text-white text-[10px] font-black uppercase tracking-widest">Update</p>
                        </div>
                    </div>
                </div>

                <div className="px-8 pb-10">
                    <div className="flex justify-center -mt-6 mb-8 relative z-20">
                        <div className="bg-white px-6 py-2 rounded-2xl shadow-lg border border-gray-50 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{profile.role}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <EditInput field="name" label="Display Name" icon={User} />
                        <EditInput field="about" label="Store Location" icon={Store} />
                        <EditInput field="phone" label="Contact Number" icon={Phone} />
                        <EditInput field="email" label="Email Address" icon={Mail} />
                        <EditInput field="address" label="Full Address" icon={MapPin} />
                        <div className="py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-4 -mx-4">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 text-gray-400">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">Account Status</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-emerald-600 text-base font-black uppercase tracking-wider">Verified Active</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest opacity-60 italic">
                    Member since February 2026 • PowerCell MS v2.0
                </p>
            </div>
        </div>
    );
}
