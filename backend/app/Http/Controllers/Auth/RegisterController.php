<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use App\Models\EventOrg;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users|unique:event_org',
            'password' => 'required|string|min:8|confirmed',
            'preferences' => 'required_if:role,user|array',
            'role' => 'required|string|in:user,event_organizer', // Validate role
            'pdf' => $request->role === 'event_organizer' ? 'required|mimes:pdf|max:2048' : ''
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            DB::beginTransaction();

            if ($request->role === 'event_organizer') {
                // Handle PDF Upload
                if ($request->hasFile('pdf')) {
                    $pdfPath = $request->file('pdf')->store('event_org_pdfs', 'public');
                }

                // Create in User table with is_organizer_pending flag
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'preferences' => $request->preferences ? json_encode($request->preferences) : null,
                    'is_organizer_pending' => true
                ]);
                
                // Create wallet for user
                Wallet::create([
                    'user_id' => $user->id,
                    'balance' => 0,
                    'coins' => 0
                ]);

                // Store in event_org table with isVerified=false
                $eventOrg = EventOrg::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'pdf_path' => $pdfPath ?? null,
                    'isVerified' => false
                ]);

                DB::commit();
                return response()->json([
                    'message' => 'Your organizer account is pending approval. An administrator will review your application soon.',
                    'event_organizer' => $eventOrg,
                    'status' => 'pending_approval'
                ], 201);
            } else {
                // Normal User Registration
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'preferences' => json_encode($request->preferences)
                ]);

                // Create wallet for user
                Wallet::create([
                    'user_id' => $user->id,
                    'balance' => 0,
                    'coins' => 0
                ]);

                $token = $user->createToken('auth_token')->plainTextToken;

                DB::commit();

                return response()->json([
                    'message' => 'User registered successfully',
                    'user' => $user,
                    'token' => $token
                ], 201);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
