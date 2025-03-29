<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Event;
use App\Models\Wallet;
use App\Models\AdminRecommendation;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use App\Models\EventOrg;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function getStats()
    {
        $stats = [
            'totalUsers' => User::count(),
            'totalEvents' => Event::count(),
            'pendingOrganizers' => User::where('is_organizer_pending', true)->count(),
            'pendingRecommendations' => AdminRecommendation::where('status', 'pending')->count(),
            'totalRevenue' => Transaction::where('status', 'completed')->sum('amount') ?? 0,
        ];

        return response()->json($stats);
    }

    /**
     * Get all users
     */
    public function getUsers()
    {
        $users = User::with('wallet')->get()->map(function($user) {
            $role = $user->is_admin ? 'Admin' : ($user->is_organizer ? 'Organizer' : 'User');
            return array_merge($user->toArray(), ['role' => $role]);
        });
        return response()->json($users);
    }

    /**
     * Delete a user
     */
    public function deleteUser($id)
    {
        DB::beginTransaction();

        try {
            // First check if it's a regular user
            $user = User::find($id);
            
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            // Don't allow deleting admin users
            if ($user->is_admin) {
                return response()->json(['message' => 'Cannot delete admin users'], 403);
            }

            // Delete related data for regular user
            if ($user->wallet) {
                // Delete transactions first since they depend on wallet
                $user->wallet->transactions()->delete();
                $user->wallet->delete();
            }
            
            // Delete the user's events
            Event::where('organizer_id', $user->id)->delete();
            
            // If user is an organizer, delete their event_org record
            if ($user->is_organizer) {
                EventOrg::where('email', $user->email)->delete();
            }
            
            // Revoke all tokens for this user
            $user->tokens()->delete();
            
            // Delete the user
            $user->delete();
            
            DB::commit();
            return response()->json(['message' => 'User deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting user: ' . $e->getMessage(), [
                'user_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to delete user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all events
     */
    public function getEvents()
    {
        $events = Event::with('organizer')->get();
        return response()->json($events);
    }

    /**
     * Delete an event
     */
    public function deleteEvent(Event $event)
    {
        // Begin transaction
        DB::beginTransaction();

        try {
            // Delete related recommendations
            $event->recommendations()->delete();
            
            // Delete the event
            $event->delete();
            
            DB::commit();
            return response()->json(['message' => 'Event deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to delete event', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get pending organizer applications
     */
    public function getPendingOrganizers()
    {
        $pendingOrganizers = User::where('is_organizer_pending', true)->get();
        return response()->json($pendingOrganizers);
    }

    /**
     * Approve an organizer application
     */
    public function approveOrganizer($id)
    {
        $user = User::findOrFail($id);
        
        if (!$user->is_organizer_pending) {
            return response()->json(['message' => 'User is not pending organizer approval'], 400);
        }
        
        // Begin transaction
        DB::beginTransaction();
        
        try {
            // Update User model
            $user->is_organizer = true;
            $user->is_organizer_pending = false;
            $user->save();
            
            // Update EventOrg model if it exists
            $eventOrg = EventOrg::where('email', $user->email)->first();
            if ($eventOrg) {
                $eventOrg->isVerified = true;
                $eventOrg->save();
            }
            
            DB::commit();
            return response()->json(['message' => 'Organizer approved successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to approve organizer', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Reject an organizer application
     */
    public function rejectOrganizer($id)
    {
        $user = User::findOrFail($id);
        
        if (!$user->is_organizer_pending) {
            return response()->json(['message' => 'User is not pending organizer approval'], 400);
        }
        
        $user->is_organizer_pending = false;
        $user->save();
        
        return response()->json(['message' => 'Organizer application rejected']);
    }
} 