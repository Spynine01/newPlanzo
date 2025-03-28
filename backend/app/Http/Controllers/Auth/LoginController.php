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
                Log::info('Event Organizer Data:', [
                    'email' => $eventOrganizer->email,
                    'is_verified' => $eventOrganizer->isVerified,
                    'password_matches' => Hash::check($request->password, $eventOrganizer->password)
                ]);
            
                if ($eventOrganizer->isVerified != 1) {
                    return response()->json([
                        'message' => 'Your account is pending verification.'
                    ], 403);
                }
            
                if (Hash::check($request->password, $eventOrganizer->password)) {
                    $token = $eventOrganizer->createToken('auth_token')->plainTextToken;
                    return response()->json([
                        'message' => 'Event Organizer login successful',
                        'user' => $eventOrganizer,
                        'token' => $token,
                        'role' => 'organizer'
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

        // Check if user is an admin or event organizer
        $role = 'user';
        if ($user->is_admin) {
            $role = 'admin';
        } elseif ($user->is_organizer) {
            $role = 'organizer';
        }

        // Generate token for regular user
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
            'role' => $role
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