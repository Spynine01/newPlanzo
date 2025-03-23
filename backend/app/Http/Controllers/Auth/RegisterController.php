<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use App\Models\EventOrgPending;
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
            'email' => 'required|string|email|max:255|unique:users|unique:event_org_pending',
            'password' => 'required|string|min:8|confirmed',
            'preferences' => 'required|array',
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

                // Store in event_org_pending
                $eventOrg = EventOrgPending::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'password' => Hash::make($request->password),
                    'pdf_path' => $pdfPath ?? null,
                    'preferences' => json_encode($request->preferences)
                ]);

                DB::commit();
                return response()->json([
                    'message' => 'Registration pending approval',
                    'event_organizer' => $eventOrg
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
