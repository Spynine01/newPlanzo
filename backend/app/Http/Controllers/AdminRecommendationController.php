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
        $recommendations = AdminRecommendation::with(['event', 'transaction.wallet.user'])
            ->latest()
            ->get();

        return response()->json($recommendations);
    }

    public function store(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'type' => 'required|in:category,location,pricing',
            'recommendation' => 'required|string',
            'admin_notes' => 'nullable|string'
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

            return response()->json([
                'message' => 'Recommendation created successfully',
                'recommendation' => $recommendation
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
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

            $recommendation->admin_notes = $request->admin_notes;
            
            if ($request->status === 'approved') {
                $recommendation->approve();
            } else {
                $recommendation->reject();
            }

            DB::commit();

            return response()->json([
                'message' => 'Recommendation updated successfully',
                'recommendation' => $recommendation
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update recommendation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getEventRecommendations(Event $event)
    {
        try {
            $recommendations = $event->adminRecommendations()
                ->with('transaction')
                ->latest()
                ->get();

            return response()->json($recommendations);
        } catch (\Exception $e) {
            Log::error('Error fetching event recommendations: ' . $e->getMessage());
            return response()->json([]);
        }
    }
}
