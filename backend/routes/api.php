<?php

use App\Http\Controllers\MainUserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SuperAdminController;
use App\Http\Controllers\EventOrganisorArppoveController;

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