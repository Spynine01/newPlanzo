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
use App\Http\Controllers\PendingEventController;
use App\Http\Controllers\Admin\PendingEventController as AdminPendingEventController;


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

Route::post('/eventOrgRegister', [EventOrganisorPendingController::class, 'store']);

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

// Event routes
Route::apiResource('events', EventController::class);

// Public event routes (no authentication required)
Route::get('events', [EventController::class, 'index']);
Route::get('events/{event}', [EventController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout']);
    
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

    // Payment routes
    Route::post('/create-order', [RazorpayController::class, 'createOrder']);
    Route::post('/verify-payment', [RazorpayController::class, 'verifyPayment']);

    // Pending Events Routes
    Route::post('/pending-events', [PendingEventController::class, 'store']);
    Route::get('/pending-events/{pendingEvent}', [PendingEventController::class, 'show']);
    Route::put('/pending-events/{pendingEvent}', [PendingEventController::class, 'update']);
    Route::get('/pending-events/{pendingEvent}/recommendations', [PendingEventController::class, 'recommendations']);
    Route::post('/pending-events/{pendingEvent}/finalize', [PendingEventController::class, 'finalize']);
});

// Admin Routes
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::put('/pending-events/{pendingEvent}', [AdminPendingEventController::class, 'update']);
    Route::post('/pending-events/{pendingEvent}/finalize', [AdminPendingEventController::class, 'finalize']);
});