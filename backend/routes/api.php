<?php

use App\Http\Controllers\MainUserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\EventOrganisorArppoveController;
use App\Http\Controllers\EventOrganisorPendingController;
use MongoDB\Client;
use App\Http\Controllers\EventController;
use App\Http\Controllers\AdminRecommendationController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\RazorpayController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\RecommendationController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

Route::post('/login', [LoginController::class, 'login']);

Route::post('/register', [RegisterController::class, 'register']);

Route::post('/superadmin', [SuperAdminController::class, 'login']);

Route::post('/userlogin', [MainUserController::class, 'login']);

Route::post('/eventorg', [EventOrganisorArppoveController::class, 'login']);

Route::post('/eventOrgRegister', [RegisterController::class, 'register']);

Route::get('/eventOrgFetch', [EventOrganisorPendingController::class, 'index']);

// Route::get('/test-mongo', function () {
//     try {
//         $client = new Client();
//         $db = $client->selectDatabase('planzo');
//         $collection = $db->selectCollection('event_organizers');

//         $documents = $collection->find()->toArray();

//         return response()->json($documents, 200);
//     } catch (\Exception $e) {
//         return response()->json(['error' => $e->getMessage()], 500);
//     }
// });

// Public event routes (no authentication required)
Route::get('events', [EventController::class, 'index']);
Route::get('events/{event}', [EventController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    // Protected event routes
    Route::post('events', [EventController::class, 'store']);
    Route::put('events/{event}', [EventController::class, 'update']);
    Route::delete('events/{event}', [EventController::class, 'destroy']);

    Route::post('/logout', [LoginController::class, 'logout']);
    
    // User profile routes
    Route::get('/user', [UserController::class, 'show']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::put('/user/password', [UserController::class, 'updatePassword']);
    Route::put('/user/preferences', [UserController::class, 'updatePreferences']);
    
    // Wallet routes
    Route::get('/wallet', [WalletController::class, 'getWallet']);
    Route::get('/wallet/transactions', [WalletController::class, 'getTransactions']);
    Route::post('/wallet/top-up', [WalletController::class, 'topUp']);
    Route::post('/wallet/request-recommendation', [WalletController::class, 'requestRecommendation']);

    // Admin recommendation routes
    Route::get('/admin/recommendations', [AdminRecommendationController::class, 'index']);
    Route::post('/admin/recommendations', [AdminRecommendationController::class, 'store']);
    Route::put('/admin/recommendations/{recommendation}', [AdminRecommendationController::class, 'update']);
    Route::get('/events/{event}/recommendations', [AdminRecommendationController::class, 'getEventRecommendations']);

    // Admin dashboard routes
    Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'getStats']);
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
        Route::get('/events', [AdminController::class, 'getEvents']);
        Route::delete('/events/{event}', [AdminController::class, 'deleteEvent']);
        Route::get('/organizers/pending', [AdminController::class, 'getPendingOrganizers']);
        Route::put('/organizers/{id}/approve', [AdminController::class, 'approveOrganizer']);
        Route::delete('/organizers/{id}', [AdminController::class, 'rejectOrganizer']);
    });

    // Payment routes
    Route::post('/create-order', [RazorpayController::class, 'createOrder']);
    Route::post('/verify-payment', [RazorpayController::class, 'verifyPayment']);

    // Recommendation Routes
    Route::post('/recommendations/request', [RecommendationController::class, 'requestRecommendation']);
    Route::get('/recommendations/pending', [RecommendationController::class, 'getPendingRecommendations']);
    Route::get('/recommendations/my-recommendations', [RecommendationController::class, 'getUserRecommendations']);
    Route::post('/recommendations/respond', [RecommendationController::class, 'respondToRecommendation']);
    Route::post('/recommendations/create-event', [RecommendationController::class, 'createEventFromRecommendation']);
    Route::get('/recommendations/by-temp-id/{temp_id}', [RecommendationController::class, 'findByTempId']);
    Route::get('/recommendations/{recommendationId}', [RecommendationController::class, 'getRecommendation']);
});

// Admin routes
Route::middleware('admin')->group(function () {
    // Admin-only routes here
});

// Debugging routes
Route::get('/debug/recommendation/{id}', function($id) {
    try {
        $byId = App\Models\Recommendation::find($id);
        $byTempId = App\Models\Recommendation::where('temp_id', $id)->first();
        
        return response()->json([
            'found_by_id' => $byId ? true : false,
            'found_by_temp_id' => $byTempId ? true : false,
            'by_id' => $byId,
            'by_temp_id' => $byTempId
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});