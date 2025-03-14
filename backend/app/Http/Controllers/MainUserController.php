<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


class MainUserController extends Controller
{
    public function login(Request $request)
    {
        $user = DB::table('main_users')
            ->where('email', $request->email)
            ->where('password', $request->password);
            

            if ($user) {
                return response()->json([
                    'success' => true,
                    'message' => 'Login Successful',
                    'redirect' => 'eventDashboard' // Send redirect URL
                ]);
            }
        
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ]);
        }
}
