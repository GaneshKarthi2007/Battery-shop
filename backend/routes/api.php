<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SalesController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\DashboardController;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

Route::post('/login', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'access_token' => $token,
        'token_type' => 'Bearer',
        'user' => $user,
    ]);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('sales', SalesController::class)->only(['index', 'store', 'show']);
    Route::apiResource('services', ServiceController::class);

    Route::get('/reports', [\App\Http\Controllers\Api\ReportController::class, 'index']);
    Route::get('/reports/download', [\App\Http\Controllers\Api\ReportController::class, 'download']);
    Route::get('/reports/download/pdf', [\App\Http\Controllers\Api\ReportController::class, 'downloadPdf']);

    // Staff & Notifications
    Route::get('/staff', [\App\Http\Controllers\Api\UserController::class, 'getStaff']);
    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::put('/notifications/{notification}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);

    // Exchange records
    Route::get('/exchanges/pending', [\App\Http\Controllers\Api\ExchangeController::class, 'pendingExchanges']);
    Route::apiResource('exchanges', \App\Http\Controllers\Api\ExchangeController::class);

    // UPI Payments
    Route::post('/upi-payments', [\App\Http\Controllers\Api\UpiPaymentController::class, 'store']);
    Route::get('/upi-payments/{upiPayment}/status', [\App\Http\Controllers\Api\UpiPaymentController::class, 'status']);
    Route::post('/upi-payments/{upiPayment}/confirm', [\App\Http\Controllers\Api\UpiPaymentController::class, 'confirm']);
    Route::post('/upi-payments/{upiPayment}/finalise', [\App\Http\Controllers\Api\UpiPaymentController::class, 'finalise']);
});
