<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\EventOrgPending; // need to change this to approved
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // ✅ Check for event organizer
            //
            //
            //      NEED TO CHANGE THIS TO APPROVED AND NOT PENDING
            //
            //
            
            $eventOrganizer = EventOrgPending::where('email', $request->email)->first();
            if ($eventOrganizer && Hash::check($request->password, $eventOrganizer->password)) {
                $token = $eventOrganizer->createToken('auth_token')->plainTextToken;
    
                return response()->json([
                    'message' => 'Event Organizer login successful',
                    'user' => $eventOrganizer,
                    'token' => $token
                ], 200);
            }
        }

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

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