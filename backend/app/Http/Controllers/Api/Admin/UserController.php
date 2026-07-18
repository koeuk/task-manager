<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

/**
 * @group Admin · Users
 *
 * User management. Requires an authenticated **admin** account.
 *
 * @authenticated
 */
class UserController extends Controller
{
    /**
     * List users
     *
     * @queryParam role string Filter by role: admin, user. Example: user
     * @queryParam search string Search by name or email. Example: jane
     * @queryParam sort_by string Column to sort by: name, email, role, created_at. Example: name
     * @queryParam sort_dir string Sort direction: asc, desc. Example: asc
     * @queryParam per_page integer Results per page (default 15). Example: 15
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Filter by role
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        // Search by name or email
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Whitelist the sortable columns — sort_by goes into the SQL directly,
        // so anything outside this list must fall back to the default.
        $sortable = ['name', 'email', 'role', 'created_at'];
        $sortBy = in_array($request->sort_by, $sortable, true) ? $request->sort_by : 'created_at';
        $sortDir = strtolower($request->sort_dir) === 'asc' ? 'asc' : 'desc';

        $users = $query->orderBy($sortBy, $sortDir)
                       ->paginate($request->per_page ?? 15);

        return response()->json($users);
    }

    /**
     * Create a user
     *
     * @bodyParam name string required Example: Jane Doe
     * @bodyParam email string required Unique email. Example: jane@example.com
     * @bodyParam password string required At least 8 characters. Example: secret123
     * @bodyParam role string required One of: admin, user. Example: user
     * @bodyParam phone string Optional phone number. Example: +85512345678
     * @response 201 {"id": 5, "name": "Jane Doe", "email": "jane@example.com", "role": "user"}
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
            'password' => ['required', Password::min(8)],
            'role' => 'required|in:admin,user',
            'phone' => 'nullable|string|max:20'
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'phone' => $validated['phone'] ?? null
        ]);

        return response()->json($user, 201);
    }

    /**
     * Get a user
     *
     * @urlParam id integer required The user ID. Example: 1
     */
    public function show(string $id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    /**
     * Update a user
     *
     * @urlParam id integer required The user ID. Example: 1
     * @bodyParam name string Example: Jane D.
     * @bodyParam email string Unique email. Example: jane@example.com
     * @bodyParam role string One of: admin, user. Example: admin
     * @bodyParam phone string Phone number. Example: +85512345678
     */
    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|unique:users,email,' . $id,
            'role' => 'sometimes|in:admin,user',
            'phone' => 'nullable|string|max:20'
        ]);

        $user->update($validated);

        return response()->json($user);
    }

    /**
     * Delete a user
     *
     * The last remaining admin cannot be deleted.
     *
     * @urlParam id integer required The user ID. Example: 2
     * @response 200 {"message": "User deleted successfully"}
     * @response 403 scenario="Last admin" {"message": "Cannot delete the last admin user"}
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);
        
        // Prevent deleting the last admin
        if ($user->role === 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Cannot delete the last admin user'
                ], 403);
            }
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Update a user's role
     *
     * The last remaining admin cannot be demoted.
     *
     * @urlParam id integer required The user ID. Example: 2
     * @bodyParam role string required One of: admin, user. Example: admin
     * @response 403 scenario="Last admin" {"message": "Cannot remove admin role from the last admin user"}
     */
    public function updateRole(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'role' => 'required|in:admin,user'
        ]);

        // Prevent removing the last admin
        if ($user->role === 'admin' && $validated['role'] === 'user') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Cannot remove admin role from the last admin user'
                ], 403);
            }
        }

        $user->update(['role' => $validated['role']]);

        return response()->json($user);
    }

    /**
     * Reset a user's password
     *
     * Admin sets a new password for the user (no current password needed).
     *
     * @urlParam id integer required The user ID. Example: 2
     * @bodyParam password string required New password, at least 8 characters. Example: newpass123
     * @response 200 {"message": "Password reset successfully"}
     */
    public function resetPassword(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'password' => ['required', Password::min(8)]
        ]);

        $user->update([
            'password' => Hash::make($validated['password'])
        ]);

        return response()->json([
            'message' => 'Password reset successfully'
        ]);
    }
}