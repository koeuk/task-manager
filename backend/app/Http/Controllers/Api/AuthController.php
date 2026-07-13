<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

/**
 * @group Authentication
 *
 * Register, log in, and manage the authenticated user's account and password.
 */
class AuthController extends Controller
{
    /**
     * Register a new user
     *
     * Creates a `user`-role account and returns an API token. Admin accounts cannot be created here.
     *
     * @unauthenticated
     * @bodyParam name string required The user's full name. Example: Jane Doe
     * @bodyParam email string required A unique email address. Example: jane@example.com
     * @bodyParam password string required At least 8 characters. Example: secret123
     * @bodyParam password_confirmation string required Must match password. Example: secret123
     * @bodyParam phone string Optional phone number. Example: +85512345678
     * @response 201 scenario="Created" {"user": {"id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "user"}, "token": "1|AbCdEf...", "token_type": "Bearer"}
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
            'password' => ['required', 'confirmed', Password::min(8)],
            'phone' => 'nullable|string|max:20'
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'role' => 'user'
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer'
        ], 201);
    }

    /**
     * Log in
     *
     * Authenticates with email + password and returns an API token.
     *
     * @unauthenticated
     * @bodyParam email string required Example: jane@example.com
     * @bodyParam password string required Example: secret123
     * @response 200 scenario="Success" {"user": {"id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "user"}, "token": "1|AbCdEf...", "token_type": "Bearer"}
     * @response 401 scenario="Invalid credentials" {"message": "Invalid credentials"}
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = User::where('email', $credentials['email'])->first();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'token_type' => 'Bearer'
        ]);
    }

    /**
     * Log out
     *
     * Revokes the API token used for the current request.
     *
     * @authenticated
     * @response 200 {"message": "Successfully logged out"}
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    }

    /**
     * Get the authenticated user
     *
     * @authenticated
     * @response 200 {"id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "user", "phone": null, "avatar": null}
     */
    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Update profile
     *
     * @authenticated
     * @bodyParam name string The user's full name. Example: Jane D.
     * @bodyParam email string A unique email address. Example: jane@example.com
     * @bodyParam phone string Phone number. Example: +85512345678
     * @bodyParam avatar string Avatar URL. Example: https://example.com/avatar.png
     * @response 200 {"message": "Profile updated successfully", "user": {"id": 1, "name": "Jane D."}}
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|string'
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Change password
     *
     * The user portal sends `current_password` (required there); the admin panel may omit it.
     * When supplied, the current password is verified.
     *
     * @authenticated
     * @bodyParam current_password string The current password (verified only when provided). Example: oldpass123
     * @bodyParam password string required New password, at least 8 characters. Example: newpass123
     * @bodyParam password_confirmation string required Must match password. Example: newpass123
     * @response 200 {"message": "Password changed successfully"}
     * @response 422 scenario="Wrong current password" {"message": "Current password is incorrect"}
     */
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'nullable',
            'password' => ['required', 'confirmed', Password::min(8)]
        ]);

        $user = $request->user();

        // Verify the current password only when it is supplied. The user portal
        // still sends and requires it; the admin panel lets an already-authenticated
        // admin set a new password without re-entering the old one.
        if ($request->filled('current_password') && !Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password'])
        ]);

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }

    /**
     * Request a password reset token
     *
     * Generates a reset token. In production it would be emailed; here it is returned
     * in the response so the SPA reset flow works without a configured mailer.
     *
     * @unauthenticated
     * @bodyParam email string required Example: jane@example.com
     * @response 200 {"message": "Password reset token generated.", "email": "jane@example.com", "token": "AbCdEf..."}
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = User::where('email', $request->email)->first();

        // Do not reveal whether the email exists
        if (!$user) {
            return response()->json([
                'message' => 'If an account exists for that email, a reset token has been generated.'
            ]);
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'email' => $request->email,
                'token' => Hash::make($token),
                'created_at' => now()
            ]
        );

        return response()->json([
            'message' => 'Password reset token generated.',
            'email' => $request->email,
            'token' => $token // emailed in production
        ]);
    }

    /**
     * Reset password with a token
     *
     * @unauthenticated
     * @bodyParam email string required Example: jane@example.com
     * @bodyParam token string required The token from the reset request. Example: AbCdEf...
     * @bodyParam password string required New password, at least 8 characters. Example: newpass123
     * @bodyParam password_confirmation string required Must match password. Example: newpass123
     * @response 200 {"message": "Password has been reset successfully. You can now log in."}
     * @response 422 scenario="Invalid/expired token" {"message": "Invalid password reset token."}
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(8)]
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (!$record || !Hash::check($validated['token'], $record->token)) {
            return response()->json([
                'message' => 'Invalid password reset token.'
            ], 422);
        }

        // Tokens are valid for 60 minutes
        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
            return response()->json([
                'message' => 'Password reset token has expired.'
            ], 422);
        }

        User::where('email', $validated['email'])->update([
            'password' => Hash::make($validated['password'])
        ]);

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        return response()->json([
            'message' => 'Password has been reset successfully. You can now log in.'
        ]);
    }

    /**
     * Upload avatar
     *
     * Uploads/replaces the authenticated user's avatar image.
     *
     * @authenticated
     * @bodyParam avatar file required Image file (jpeg, jpg, png, gif, webp), max 2 MB.
     * @response 200 {"message": "Avatar updated successfully", "avatar": "http://localhost:8000/storage/avatars/abc.png"}
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,jpg,png,gif,webp|max:2048' // 2 MB
        ]);

        $user = $request->user();

        // Remove the previously stored avatar (only files we stored under /storage)
        if ($user->avatar && str_contains($user->avatar, '/storage/avatars/')) {
            $old = Str::after($user->avatar, '/storage/');
            Storage::disk('public')->delete($old);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $url = url('storage/' . $path);

        $user->update(['avatar' => $url]);

        return response()->json([
            'message' => 'Avatar updated successfully',
            'user' => $user,
            'avatar' => $url
        ]);
    }
}