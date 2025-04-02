<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuperAdminController extends Controller
{
    public function login(Request $request)
    {
        $superAdmin = DB::table('super_admin')
            ->where('user', $request->user)
            ->where('password', $request->password);
            

            if ($superAdmin) {
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