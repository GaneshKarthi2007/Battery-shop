import { useState, useEffect } from "react";
import { Users, Plus, Loader2, Lock, ArrowLeft, Trash2, ShieldCheck, Code, UserCheck } from "lucide-react";
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

    // Delete state
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteError, setDeleteError] = useState("");

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

    const handleDeleteUser = async (id: number) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        setDeletingId(id);
        setDeleteError("");

        try {
            await apiClient.delete(`/users/${id}`);
            fetchUsers();
        } catch (e: any) {
            setDeleteError(e.message || "Failed to delete user.");
        } finally {
            setDeletingId(null);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'developer':
                return <Code className="w-3.5 h-3.5" />;
            case 'admin':
                return <ShieldCheck className="w-3.5 h-3.5" />;
            default:
                return <UserCheck className="w-3.5 h-3.5" />;
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    aria-label="Go Back"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#25334D] rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase">User Management</h1>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Create or manage system users & developer accounts</p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1B263B] rounded-[2rem] border border-gray-100 dark:border-[#2E3B55] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 dark:border-[#2E3B55] bg-gradient-to-r from-gray-50 to-white dark:from-[#1B263B] dark:to-[#25334D]">
                    <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Create New User</h2>
                    </div>
                </div>
                <div className="p-6">
                    <div className="space-y-4 max-w-md mx-auto">
                        <div>
                            <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                            <input
                                id="user-name"
                                type="text"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#2E3B55] dark:bg-[#0D1B2A] dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                placeholder="E.g., Jane Developer"
                            />
                        </div>
                        <div>
                            <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                            <input
                                id="user-email"
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#2E3B55] dark:bg-[#0D1B2A] dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                placeholder="E.g., jane@developer.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="user-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    id="user-password"
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-[#2E3B55] dark:bg-[#0D1B2A] dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter secure password (min 6 chars)"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">System Role</label>
                            <select
                                id="user-role"
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 dark:border-[#2E3B55] dark:bg-[#0D1B2A] dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            >
                                <option value="staff">Staff - Standard Access</option>
                                <option value="admin">Admin - Full Access</option>
                                <option value="developer">Developer - System Config & Dev Access</option>
                            </select>
                        </div>

                        {createError && (
                            <div className="text-red-500 text-sm mt-2 font-medium" role="alert">{createError}</div>
                        )}
                        {createSuccess && (
                            <div className="text-green-600 text-sm mt-2 font-medium" role="status">User created successfully!</div>
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

                    <div className="mt-8 border-t border-gray-100 dark:border-[#2E3B55] pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white">Existing Users</h3>
                            <button
                                onClick={fetchUsers}
                                className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider hover:text-purple-800 transition-colors"
                            >
                                Refresh
                            </button>
                        </div>

                        {deleteError && (
                            <div className="text-red-500 text-sm mb-3 font-medium">{deleteError}</div>
                        )}

                        {loadingUsers ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                            </div>
                        ) : users.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No other users found or failed to load.</p>
                        ) : (
                            <div className="space-y-3">
                                {users.map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0D1B2A] border border-gray-100 dark:border-[#2E3B55] rounded-xl">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{u.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase flex items-center gap-1 ${
                                                u.role === 'admin' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' :
                                                u.role === 'developer' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' :
                                                'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                            }`}>
                                                {getRoleIcon(u.role)}
                                                {u.role}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                disabled={deletingId === u.id}
                                                aria-label={`Delete user ${u.name}`}
                                                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-200 dark:hover:bg-[#1B263B] transition-colors disabled:opacity-50"
                                            >
                                                {deletingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
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

