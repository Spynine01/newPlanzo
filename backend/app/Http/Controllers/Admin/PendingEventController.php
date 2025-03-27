<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PendingEvent;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PendingEventController extends Controller
{
    public function update(Request $request, PendingEvent $pendingEvent)
    {
        $validatedData = $request->validate([
            'location' => 'nullable|string',
            'venue' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'available_tickets' => 'nullable|integer|min:0'
        ]);

        $pendingEvent->update($validatedData);

        return response()->json([
            'message' => 'Pending event updated successfully',
            'pending_event' => $pendingEvent
        ]);
    }

    public function finalize(PendingEvent $pendingEvent)
    {
        try {
            DB::beginTransaction();

            // Create new event from pending event
            $event = $pendingEvent->toEvent();
            $event->save();

            // Update recommendations with the new event ID
            $pendingEvent->recommendations()->update([
                'event_id' => $event->id
            ]);

            // Mark pending event as finalized
            $pendingEvent->update(['status' => 'finalized']);

            DB::commit();

            return response()->json([
                'message' => 'Event finalized successfully',
                'event' => $event
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to finalize event',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
