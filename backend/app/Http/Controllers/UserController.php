<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get the authenticated user's profile.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request)
    {
        $user = $request->user();
        
        // Load user data with preferences
        $userData = $user->toArray();
        
        // Add preferences data if it exists
        $preferences = $user->preferences;
        $userData['preferences'] = $preferences ? json_decode($preferences, true) : null;
        
        // Add role information
        $userData['role'] = $user->is_admin ? 'Admin' : ($user->is_organizer ? 'Organizer' : 'User');
        
        return response()->json($userData);
    }

    /**
     * Update the user's profile information.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
        ]);
        
        $user->update($validated);
        
        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Update the user's password.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);
        
        $user = $request->user();
        
        // Check if current password matches
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 422);
        }
        
        // Update password
        $user->password = Hash::make($request->password);
        $user->save();
        
        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }

    /**
     * Update the user's preferences.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updatePreferences(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'preferences' => 'required|array',
            'preferences.category' => 'nullable|string',
            'preferences.location' => 'nullable|string',
            'preferences.notifications' => 'boolean',
        ]);
        
        // Store preferences as JSON
        $user->preferences = json_encode($request->preferences);
        $user->save();
        
        return response()->json([
            'message' => 'Preferences updated successfully',
            'preferences' => $request->preferences
        ]);
    }
} 