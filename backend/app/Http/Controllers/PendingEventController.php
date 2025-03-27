<?php

namespace App\Http\Controllers;

use App\Models\PendingEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PendingEventController extends Controller
{
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string',
            'date' => 'nullable|date',
            'time' => 'nullable',
            'location' => 'nullable|string',
            'venue' => 'nullable|string',
            'address' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'available_tickets' => 'nullable|integer|min:0',
            'image' => 'nullable|image|max:2048'
        ]);

        $validatedData['user_id'] = Auth::id();

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('events', 'public');
            $validatedData['image'] = $path;
        }

        // Create or update pending event
        $pendingEvent = PendingEvent::updateOrCreate(
            ['user_id' => Auth::id(), 'status' => 'pending'],
            $validatedData
        );

        return response()->json([
            'message' => 'Event saved as pending',
            'pending_event' => $pendingEvent
        ], 201);
    }

    public function show(PendingEvent $pendingEvent)
    {
        $this->authorize('view', $pendingEvent);
        
        return response()->json([
            'pending_event' => $pendingEvent->load('recommendations')
        ]);
    }

    public function update(Request $request, PendingEvent $pendingEvent)
    {
        $this->authorize('update', $pendingEvent);

        $validatedData = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'category' => 'sometimes|string',
            'date' => 'sometimes|date',
            'time' => 'sometimes',
            'location' => 'nullable|string',
            'venue' => 'nullable|string',
            'address' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'available_tickets' => 'nullable|integer|min:0',
            'image' => 'nullable|image|max:2048'
        ]);

        if ($request->hasFile('image')) {
            if ($pendingEvent->image) {
                Storage::disk('public')->delete($pendingEvent->image);
            }
            $path = $request->file('image')->store('events', 'public');
            $validatedData['image'] = $path;
        }

        $pendingEvent->update($validatedData);

        return response()->json([
            'message' => 'Pending event updated successfully',
            'pending_event' => $pendingEvent
        ]);
    }

    public function recommendations(PendingEvent $pendingEvent)
    {
        $this->authorize('view', $pendingEvent);
        
        $recommendations = $pendingEvent->recommendations()
            ->with('event')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($recommendations);
    }

    public function finalize(Request $request, PendingEvent $pendingEvent)
    {
        $this->authorize('update', $pendingEvent);

        // Validate the request
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
            'date' => 'required|date',
            'time' => 'required',
            'location' => 'required|string',
            'venue' => 'required|string',
            'address' => 'required|string',
            'price' => 'required|numeric|min:0',
            'available_tickets' => 'required|integer|min:0',
            'image' => 'required|string'
        ]);

        // Update the pending event with the final data
        $pendingEvent->update($validatedData);
        $pendingEvent->status = 'pending_approval';
        $pendingEvent->save();

        return response()->json([
            'message' => 'Event finalized successfully',
            'pending_event' => $pendingEvent
        ]);
    }
}
