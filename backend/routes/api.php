<?php

use App\Http\Controllers\MainUserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\EventOrganisorArppoveController;
use App\Http\Controllers\EventOrganisorPendingController;
use MongoDB\Client;
use App\Http\Controllers\EventController;


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



Route::post('/superadmin', [SuperAdminController::class, 'login']);


Route::post('/userlogin', [MainUserController::class, 'login']);


Route::post('/eventorg', [EventOrganisorArppoveController::class, 'login']);


Route::post('/register', [MainUserController::class, 'register']);


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