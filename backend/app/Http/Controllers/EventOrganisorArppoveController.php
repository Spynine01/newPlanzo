<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventOrganisorArppoveController extends Controller
{
    public function login(Request $request)
    {
        $eventOrg = DB::table('event_organisor_approved')
            ->where('email', $request->email)
            ->where('password', $request->password)
            ->first();

            if ($eventOrg) {
                return response()->json([
                    'success' => true,
                    'message' => 'Login Successful',
                    'redirect' => '/dashboard' // Send redirect URL
                ]);
            }
        
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ]);
        }
}
