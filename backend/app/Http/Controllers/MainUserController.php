<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\MainUser;  



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
                    'redirect' => 'events' // Send redirect URL
                ]);
            }
        
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ]);
        }

        public function register(Request $request)
    {
        
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:main_users,email',
            'password' => 'required|min:6',
            'preferences' => 'required|array|min:1', 
            'preferences.*' => 'string', 
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        // Save user in database
        $user = MainUser::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'preferences' => $request->preferences, // Store it
        ]);

        return response()->json(['message' => 'User registered successfully', 'user' => $user], 201);
    }
}
