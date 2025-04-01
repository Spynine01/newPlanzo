<?php

namespace App\Http\Controllers;

use App\Models\Recommendation;
use App\Models\Event;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use MongoDB\Laravel\Collection;
use Exception;
use Illuminate\Support\Str;

class RecommendationController extends Controller
{
    public function requestRecommendation(Request $request)
    {
        try {
            $request->validate([
                'title' => 'nullable|string',
                'description' => 'nullable|string',
                'category' => 'nullable|string',
                'date' => 'nullable|date',
                'time' => 'nullable',
                'location' => 'nullable|array',
                'location.venue' => 'nullable|string',
                'location.address' => 'nullable|string',
                'price' => 'nullable|numeric|min:0',
                'availableTickets' => 'nullable|integer|min:0',
                'recommendationType' => 'required|string|in:location,venue,tickets',
                'recommendationText' => 'required|string',
            ]);

            Log::info('Validation passed, preparing to create recommendation', [
                'organizer_id' => auth()->id(),
                'recommendation_type' => $request->recommendationType
            ]);

            // Start a database transaction
            return DB::transaction(function () use ($request) {
                try {
                    // Check and update wallet balance
                    $wallet = Wallet::where('user_id', auth()->id())->first();
                    
                    Log::info('Wallet found', [
                        'wallet_id' => $wallet->id,
                        'balance' => $wallet->coins
                    ]);
                    
                    if (!$wallet || $wallet->coins < 10) {
                        throw new Exception('Insufficient coins. Please top up your wallet.');
                    }

                    // Deduct coins
                    $wallet->coins -= 10;
                    $wallet->save();

                    Log::info('Coins deducted from wallet', [
                        'wallet_id' => $wallet->id,
                        'new_balance' => $wallet->coins
                    ]);

                    try {
                        // Create recommendation request data
                        $data = [
                            'organizerId' => auth()->id(),
                            'eventData' => [
                                'title' => $request->title,
                                'description' => $request->description,
                                'category' => $request->category,
                                'date' => $request->date,
                                'time' => $request->time,
                                'location' => $request->location,
                                'price' => $request->price,
                                'available_tickets' => $request->availableTickets
                            ],
                            'recommendationType' => $request->recommendationType,
                            'recommendationText' => $request->recommendationText,
                            'status' => 'pending',
                            'responseText' => null,
                            'created_at' => now(),
                            'updated_at' => now()
                        ];
                        
                        Log::info('About to create recommendation with data', [
                            'data' => json_encode($data)
                        ]);
                        
                        // Create recommendation request
                        $recommendation = new Recommendation($data);
                        $recommendation->save();

                        Log::info('Recommendation saved', [
                            'recommendation_id' => (string)$recommendation->_id ?? 'null'
                        ]);

                        // If MongoDB didn't generate an ID (shouldn't happen, but just in case)
                        if (!$recommendation->_id) {
                            Log::warning('MongoDB did not generate an ID, using UUID');
                            $tempId = (string) Str::uuid();
                            
                            // Store the temporary ID in the temp_id field
                            $recommendation->temp_id = $tempId;
                            $recommendation->save();
                            
                            Log::info('Recommendation updated with temporary ID', [
                                'temp_id' => $tempId,
                                'recommendation_id' => 'null'
                            ]);
                        }

                        // Return a consistent response format
                        return response()->json([
                            'message' => 'Recommendation request submitted successfully',
                            'recommendation' => [
                                '_id' => (string)$recommendation->_id,
                                'temp_id' => $recommendation->temp_id ?? null,
                                'organizerId' => $recommendation->organizerId,
                                'eventData' => $recommendation->eventData,
                                'recommendationType' => $recommendation->recommendationType,
                                'recommendationText' => $recommendation->recommendationText,
                                'status' => $recommendation->status,
                                'responseText' => $recommendation->responseText,
                                'created_at' => $recommendation->created_at,
                                'updated_at' => $recommendation->updated_at
                            ],
                            'wallet' => $wallet
                        ]);
                    } catch (Exception $e) {
                        Log::error('MongoDB Error when creating recommendation: ' . $e->getMessage(), [
                            'exception' => get_class($e),
                            'file' => $e->getFile(),
                            'line' => $e->getLine(),
                            'trace' => $e->getTraceAsString(),
                            'organizer_id' => auth()->id()
                        ]);
                        
                        // Refund the coins since recommendation creation failed
                        $wallet->coins += 10;
                        $wallet->save();
                        
                        Log::info('Coins refunded due to error', [
                            'wallet_id' => $wallet->id,
                            'coins' => $wallet->coins
                        ]);
                        
                        throw $e;
                    }
                } catch (Exception $e) {
                    Log::error('Error in recommendation transaction: ' . $e->getMessage(), [
                        'exception' => get_class($e),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                        'trace' => $e->getTraceAsString(),
                        'organizer_id' => auth()->id()
                    ]);
                    throw $e;
                }
            });
        } catch (Exception $e) {
            Log::error('Error creating recommendation request: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'organizer_id' => auth()->id() ?? 'no auth'
            ]);

            return response()->json([
                'message' => 'Failed to submit recommendation request: ' . $e->getMessage()
            ], $e instanceof \Illuminate\Validation\ValidationException ? 422 : 500);
        }
    }

    public function respondToRecommendation(Request $request)
    {
        try {
            $request->validate([
                'recommendationId' => 'required|string',
                'responseText' => 'required|string'
            ]);

            // First try to find by _id
            $recommendation = Recommendation::find($request->recommendationId);
            
            // If not found, try to find by temp_id
            if (!$recommendation) {
                Log::info('Recommendation not found by _id when responding, trying temp_id', [
                    'recommendation_id' => $request->recommendationId
                ]);
                
                $recommendation = Recommendation::where('temp_id', $request->recommendationId)->first();
            }

            if (!$recommendation) {
                return response()->json([
                    'message' => 'Recommendation not found'
                ], 404);
            }

            $recommendation->update([
                'responseText' => $request->responseText,
                'status' => 'responded'
            ]);

            Log::info('Admin responded to recommendation', [
                'recommendation_id' => $recommendation->_id,
                'temp_id' => $recommendation->temp_id ?? 'none',
                'admin_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Response submitted successfully',
                'recommendation' => $recommendation
            ]);
        } catch (\Exception $e) {
            Log::error('Error responding to recommendation', [
                'error' => $e->getMessage(),
                'admin_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to submit response'
            ], 500);
        }
    }

    public function getRecommendation($recommendationId)
    {
        try {
            Log::info('Getting recommendation', [
                'id' => $recommendationId
            ]);

            // First try to find by _id
            $recommendation = Recommendation::find($recommendationId);
            
            if ($recommendation) {
                Log::info('Found recommendation by _id', [
                    'recommendation_id' => $recommendationId,
                    'temp_id' => $recommendation->temp_id ?? 'none'
                ]);
                
                // Return full recommendation data
                return response()->json([
                    '_id' => (string)$recommendation->_id,
                    'temp_id' => $recommendation->temp_id ?? null,
                    'organizerId' => $recommendation->organizerId,
                    'eventData' => $recommendation->eventData,
                    'status' => $recommendation->status,
                    'responseText' => $recommendation->responseText,
                    'created_at' => $recommendation->created_at,
                    'updated_at' => $recommendation->updated_at
                ]);
            }
            
            // If not found, try to find by temp_id using a direct query
            Log::info('Not found by _id, trying temp_id', [
                'recommendation_id' => $recommendationId
            ]);
            
            $recommendation = Recommendation::where('temp_id', $recommendationId)->first();
            
            if ($recommendation) {
                Log::info('Found recommendation by temp_id where clause', [
                    'recommendation_id' => $recommendationId,
                    'actual_id' => (string)$recommendation->_id
                ]);
                
                // Return full recommendation data
                return response()->json([
                    '_id' => (string)$recommendation->_id,
                    'temp_id' => $recommendation->temp_id,
                    'organizerId' => $recommendation->organizerId,
                    'eventData' => $recommendation->eventData,
                    'status' => $recommendation->status,
                    'responseText' => $recommendation->responseText,
                    'created_at' => $recommendation->created_at,
                    'updated_at' => $recommendation->updated_at
                ]);
            }

            Log::warning('Recommendation not found by any method', [
                'recommendation_id' => $recommendationId
            ]);
            
            return response()->json([
                'message' => 'Recommendation not found'
            ], 404);
        } catch (Exception $e) {
            Log::error('Error fetching recommendation: ' . $e->getMessage(), [
                'error' => $e->getMessage(),
                'recommendation_id' => $recommendationId,
                'stack_trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch recommendation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createEventFromRecommendation(Request $request)
    {
        try {
            $request->validate([
                'recommendationId' => 'required|string'
            ]);

            $recommendation = Recommendation::find($request->recommendationId);

            if (!$recommendation || $recommendation->status !== 'responded') {
                return response()->json([
                    'message' => 'Invalid recommendation or not responded yet'
                ], 400);
            }

            // Create the event in MySQL
            $event = Event::create([
                'organizer_id' => $recommendation->organizerId,
                'title' => $recommendation->eventData['title'],
                'description' => $recommendation->eventData['description'],
                'date' => $recommendation->eventData['date'],
                'time' => $recommendation->eventData['time'],
                'venue' => $recommendation->eventData['venue'],
                'price' => $recommendation->eventData['price'],
                'available_tickets' => $recommendation->eventData['available_tickets'],
                'admin_recommendation' => $recommendation->responseText
            ]);

            Log::info('Event created from recommendation', [
                'event_id' => $event->id,
                'recommendation_id' => $recommendation->_id
            ]);

            return response()->json([
                'message' => 'Event created successfully',
                'event' => $event
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating event from recommendation', [
                'error' => $e->getMessage(),
                'recommendation_id' => $request->recommendationId
            ]);

            return response()->json([
                'message' => 'Failed to create event'
            ], 500);
        }
    }

    public function getPendingRecommendations()
    {
        try {
            // Get both pending and responded recommendations, ordered by creation date
            $recommendations = Recommendation::orderBy('created_at', 'desc')
                ->get();

            // Log the recommendations we're returning for debugging
            Log::info('Fetching all recommendations', [
                'count' => $recommendations->count(),
                'first_id' => $recommendations->first() ? $recommendations->first()->_id : 'none',
                'user_id' => auth()->id() ?: 'not authenticated'
            ]);

            return response()->json($recommendations);
        } catch (Exception $e) {
            Log::error('Error fetching recommendations', [
                'error' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch recommendations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recommendations for the current authenticated user (organizer)
     */
    public function getUserRecommendations()
    {
        try {
            $userId = auth()->id();
            
            Log::info('Fetching recommendations for user', [
                'user_id' => $userId
            ]);
            
            $recommendations = Recommendation::where('organizerId', $userId)
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json($recommendations);
        } catch (Exception $e) {
            Log::error('Error fetching user recommendations: ' . $e->getMessage(), [
                'error' => $e->getMessage(),
                'user_id' => auth()->id() ?? 'not authenticated',
                'stack_trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to fetch recommendations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Find a recommendation by temp_id
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function findByTempId(Request $request)
    {
        try {
            Log::info('Finding recommendation by temp_id: ' . $request->temp_id);
            
            $recommendation = Recommendation::where('temp_id', $request->temp_id)->first();
            
            if (!$recommendation) {
                Log::warning('No recommendation found with temp_id: ' . $request->temp_id);
                return response()->json(['error' => 'Recommendation not found'], 404);
            }
            
            Log::info('Found recommendation by temp_id: ' . $recommendation->_id);
            return response()->json($recommendation);
        } catch (\Exception $e) {
            Log::error('Error finding recommendation by temp_id: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to find recommendation'], 500);
        }
    }
} 