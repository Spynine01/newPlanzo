<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\EventOrg; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class LoginController extends Controller
{
    public function login(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    // Check if the user exists in the 'users' table
    $user = User::where('email', $request->email)->first();

    // If user is not found, check in 'event_orgs' table
    if (!$user) {
        $eventOrganizer = EventOrg::where('email', $request->email)->first();
        
        if ($eventOrganizer) {
            // 🔹 Debug: Check if `is_verified` is correct
            Log::info('Event Organizer Data:', [
                'email' => $eventOrganizer->email,
                'is_verified' => $eventOrganizer->isVerified,
                'password_matches' => Hash::check($request->password, $eventOrganizer->password)
            ]);
        
            if ($eventOrganizer->is_verified != 1) { // 🔹 Use `is_verified`
                return response()->json([
                    'message' => 'Your account is pending verification.'
                ], 403);
            }
        
            if (Hash::check($request->password, $eventOrganizer->password)) {
                $token = $eventOrganizer->createToken('auth_token')->plainTextToken;
                return response()->json([
                    'message' => 'Event Organizer login successful',
                    'user' => $eventOrganizer,
                    'token' => $token
                ], 200);
            }
        }
    }

    // Check login for normal users
    if (!$user || !Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    // Generate token for regular user
    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'message' => 'Login successful',
        'user' => $user,
        'token' => $token
    ]);
}

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }
} 