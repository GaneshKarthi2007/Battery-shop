import { useState, useEffect } from "react";
import { Users, Plus, Loader2, Lock, ArrowLeft } from "lucide-react";
import { apiClient } from "../api/client";
import { useNavigate } from "react-router";

export function UserManagement() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // User Form
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "staff" });
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState("");
    const [createSuccess, setCreateSuccess] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const data = await apiClient.get<any[]>('/users');
            setUsers(data);
        } catch (e: any) {
            console.error("Failed to load users", e);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            setCreateError("All fields are required.");
            return;
        }
        setIsCreating(true);
        setCreateError("");
        setCreateSuccess(false);

        try {
            await apiClient.post('/users', newUser);
            setCreateSuccess(true);
            setNewUser({ name: "", email: "", password: "", role: "staff" });
            fetchUsers(); // Refresh the list
        } catch (e: any) {
            setCreateError(e.message || "Failed to create user.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-800" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase">User Management</h1>
                    <p className="text-sm font-medium text-gray-500">Create or manage system users</p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-purple-600" />
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Create New User</h2>
                    </div>
                </div>
                <div className="p-6">
                    <div className="space-y-4 max-w-md mx-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                placeholder="E.g., John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                placeholder="E.g., john@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter a secure password"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
                            <select
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all appearance-none"
                            >
                                <option value="staff">Staff - Standard Access</option>
                                <option value="admin">Admin - Full Access</option>
                                <option value="developer">Developer - System Config</option>
                            </select>
                        </div>

                        {createError && (
                            <div className="text-red-500 text-sm mt-2">{createError}</div>
                        )}
                        {createSuccess && (
                            <div className="text-green-600 text-sm mt-2 font-medium">User created successfully!</div>
                        )}

                        <button
                            onClick={handleCreateUser}
                            disabled={isCreating}
                            className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            Create New User
                        </button>
                    </div>

                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Existing Users</h3>
                            <button
                                onClick={fetchUsers}
                                className="text-xs font-bold text-purple-600 uppercase tracking-wider hover:text-purple-800 transition-colors"
                            >
                                Refresh
                            </button>
                        </div>

                        {loadingUsers ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                            </div>
                        ) : users.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No other users found or failed to load.</p>
                        ) : (
                            <div className="space-y-3">
                                {users.map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                                            <p className="text-xs text-gray-500">{u.email}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                                            u.role === 'developer' ? 'bg-purple-100 text-purple-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
