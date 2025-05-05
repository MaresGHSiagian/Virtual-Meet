<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Chat;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/chat', function () {
    return Chat::orderBy('created_at')->get(['sender', 'text']);
});

Route::post('/chat/send', function (Request $request) {
    $data = $request->validate([
        'sender' => 'required|string|max:255',
        'text' => 'required|string',
    ]);
    Chat::create($data);
    return response()->json(['success' => true]);
});



