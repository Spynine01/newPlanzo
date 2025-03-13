<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuperAdminController extends Controller
{
    public function login(Request $request)
    {
        $user = DB::table('super_admin')
            ->where('user', $request->user)
            ->where('password', $request->password)
            ->first();

        if ($user) {
            return response()->json(['message' => 'Login successful']);
        } else {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }
    }
}