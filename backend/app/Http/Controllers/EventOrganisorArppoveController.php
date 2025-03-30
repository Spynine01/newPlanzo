<?php

namespace App\Http\Controllers;

use App\Models\EventOrganiser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EventOrganisorArppoveController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $eventOrg = EventOrganiser::where('email', $request->email)->first();

        if (!$eventOrg) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Since we're storing plain passwords (not recommended), we'll do a direct comparison
        // TODO: Implement proper password hashing in the future
        if ($request->password !== $eventOrg->password) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Create a Sanctum token
        $token = $eventOrg->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login Successful',
            'email' => $eventOrg->email,
            'token' => $token,
            'redirect' => 'eventDashboard'
        ]);
    }
}
