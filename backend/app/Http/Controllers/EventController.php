<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class EventController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Event::query();

            if ($request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('category', 'like', "%{$search}%")
                      ->orWhere('location', 'like', "%{$search}%");
                });
            }

            if ($request->category && $request->category !== 'All') {
                $query->where('category', $request->category);
            }

            if ($request->location) {
                $query->where('location', 'like', "%{$request->location}%");
            }

            if ($request->price_range) {
                switch ($request->price_range) {
                    case '0-500':
                        $query->where('price', '<=', 500);
                        break;
                    case '500-1000':
                        $query->whereBetween('price', [500, 1000]);
                        break;
                    case '1000-2000':
                        $query->whereBetween('price', [1000, 2000]);
                        break;
                    case '2000+':
                        $query->where('price', '>', 2000);
                        break;
                }
            }

            if ($request->date_range) {
                $today = now()->startOfDay();
                switch ($request->date_range) {
                    case 'today':
                        $query->whereDate('date', $today);
                        break;
                    case 'week':
                        $query->whereBetween('date', [$today, $today->copy()->endOfWeek()]);
                        break;
                    case 'month':
                        $query->whereBetween('date', [$today, $today->copy()->endOfMonth()]);
                        break;
                    case 'future':
                        $query->where('date', '>=', $today);
                        break;
                }
            }

            $events = $query->latest()->paginate(12);
            return response()->json($events);
        } catch (\Exception $e) {
            Log::error('Error fetching events: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch events'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            // Log incoming request data
            Log::info('Incoming event creation request data:', [
                'all' => $request->all(),
                'files' => $request->allFiles(),
                'headers' => $request->headers->all()
            ]);

            // Validate the request
            $validator = Validator::make($request->all(), [
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
                'image' => 'nullable|image|max:2048'
            ]);

            if ($validator->fails()) {
                Log::warning('Event validation failed:', [
                    'errors' => $validator->errors()->toArray(),
                    'input' => $request->all()
                ]);
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get validated data
            $data = $validator->validated();
            Log::info('Validated data:', $data);

            // Handle image upload
            if ($request->hasFile('image')) {
                try {
                    Log::info('Processing image upload');
                    $path = $request->file('image')->store('events', 'public');
                    $data['image_url'] = Storage::url($path);
                    Log::info('Image uploaded successfully:', [
                        'path' => $path,
                        'url' => $data['image_url']
                    ]);
                } catch (Exception $e) {
                    Log::error('Image upload failed:', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    return response()->json([
                        'message' => 'Failed to upload image',
                        'error' => $e->getMessage()
                    ], 500);
                }
            }

            // Set default organizer_id
            $data['organizer_id'] = 1;

            // Create event
            Log::info('Attempting to create event with data:', $data);
            $event = Event::create($data);

            Log::info('Event created successfully:', [
                'event_id' => $event->id,
                'event_data' => $event->toArray()
            ]);

            return response()->json([
                'message' => 'Event created successfully',
                'event' => $event
            ], 201);
        } catch (Exception $e) {
            Log::error('Error creating event:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);

            return response()->json([
                'message' => 'Failed to create event',
                'error' => $e->getMessage(),
                'debug' => app()->environment('local') ? [
                    'trace' => $e->getTraceAsString(),
                    'line' => $e->getLine(),
                    'file' => $e->getFile()
                ] : null
            ], 500);
        }
    }

    public function show(Event $event)
    {
        try {
            return response()->json($event);
        } catch (\Exception $e) {
            Log::error('Error fetching event: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch event'], 500);
        }
    }

    public function update(Request $request, Event $event)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'category' => 'sometimes|string',
                'date' => 'sometimes|date',
                'time' => 'sometimes',
                'location' => 'sometimes|string',
                'venue' => 'sometimes|string',
                'address' => 'sometimes|string',
                'price' => 'sometimes|numeric|min:0',
                'available_tickets' => 'sometimes|integer|min:0',
                'image' => 'nullable|image|max:2048',
                'schedule' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $validator->validated();

            if ($request->hasFile('image')) {
                if ($event->image_url) {
                    Storage::delete(str_replace('/storage/', 'public/', $event->image_url));
                }
                $path = $request->file('image')->store('events', 'public');
                $data['image_url'] = Storage::url($path);
            }

            $event->update($data);
            return response()->json($event);
        } catch (\Exception $e) {
            Log::error('Error updating event: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update event'], 500);
        }
    }

    public function destroy(Event $event)
    {
        try {
            if ($event->image_url) {
                Storage::delete(str_replace('/storage/', 'public/', $event->image_url));
            }

            $event->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error deleting event: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete event'], 500);
        }
    }
} 