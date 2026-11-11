<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $this->checkAccess($request);

        $query = User::select(['id', 'name', 'email', 'role', 'created_at', 'updated_at']);

        // Admins cannot see developer users
        if ($request->user()->role === 'admin') {
            $query->where('role', '!=', 'developer');
        }

        $users = $query->orderBy('id', 'desc')->get();

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $this->checkAccess($request);

        $allowedRoles = $request->user()->role === 'admin'
            ? ['staff', 'manager', 'admin']
            : ['staff', 'manager', 'admin', 'developer'];

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => ['required', 'string', Rule::in($allowedRoles)],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
        ]);

        return response()->json($user, 201);
    }

    public function update(Request $request, User $user)
    {
        $this->checkAccess($request);

        if ($request->user()->role === 'admin' && $user->role === 'developer') {
            return response()->json(['message' => 'Unauthorized. Admins cannot modify developer accounts.'], 403);
        }

        $allowedRoles = $request->user()->role === 'admin'
            ? ['staff', 'manager', 'admin']
            : ['staff', 'manager', 'admin', 'developer'];

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:6',
            'role' => ['sometimes', 'required', 'string', Rule::in($allowedRoles)],
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }

        if (isset($validated['role'])) {
            $user->role = $validated['role'];
        }

        if (!empty($validated['password'])) {
            $user->password = $validated['password'];
        }

        $user->save();

        return response()->json($user);
    }

    public function destroy(Request $request, User $user)
    {
        $this->checkAccess($request);

        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 400);
        }

        if ($request->user()->role === 'admin' && $user->role === 'developer') {
            return response()->json(['message' => 'Unauthorized. Admins cannot delete developer accounts.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }

    public function getStaff()
    {
        $staff = User::where('role', 'staff')->get(['id', 'name', 'email']);
        return response()->json($staff);
    }

    private function checkAccess(Request $request)
    {
        $role = $request->user()->role ?? '';
        if (!in_array($role, ['admin', 'developer'])) {
            abort(403, 'Unauthorized. Only admins and developers can manage users.');
        }
    }
}

