<?php

namespace App\Http\Controllers;

use App\Models\AdminRecommendation;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdminRecommendationController extends Controller
{
    public function index()
    {
        try {
            Log::info('Fetching admin recommendations');
            
            $recommendations = AdminRecommendation::with([
                'event',
                'transaction.wallet.user'
            ])
            ->orderBy('created_at', 'desc')
            ->get();

            Log::info('Found recommendations:', [
                'count' => $recommendations->count(),
                'data' => $recommendations->toArray()
            ]);

            return response()->json([
                'recommendations' => $recommendations
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching recommendations: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch recommendations'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'type' => 'required|in:category,location,pricing,venue,tickets',
            'recommendation' => 'required|string',
            'admin_notes' => 'nullable|string',
            'transaction_id' => 'required|exists:transactions,id'
        ]);

        try {
            DB::beginTransaction();

            $recommendation = AdminRecommendation::create([
                'event_id' => $request->event_id,
                'transaction_id' => $request->transaction_id,
                'type' => $request->type,
                'recommendation' => $request->recommendation,
                'admin_notes' => $request->admin_notes,
                'status' => 'pending'
            ]);

            DB::commit();

            Log::info('Created new recommendation:', $recommendation->toArray());

            return response()->json([
                'message' => 'Recommendation created successfully',
                'recommendation' => $recommendation
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create recommendation: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create recommendation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, AdminRecommendation $recommendation)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'admin_notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            $recommendation->status = $request->status;
            $recommendation->admin_notes = $request->admin_notes;
            $recommendation->save();

            DB::commit();

            Log::info('Updated recommendation:', [
                'id' => $recommendation->id,
                'status' => $recommendation->status,
                'notes' => $recommendation->admin_notes
            ]);

            return response()->json([
                'message' => 'Recommendation updated successfully',
                'recommendation' => $recommendation
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update recommendation: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update recommendation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getEventRecommendations(Event $event)
    {
        $recommendations = $event->adminRecommendations()
            ->with('transaction')
            ->latest()
            ->get();

        return response()->json($recommendations);
    }
}
