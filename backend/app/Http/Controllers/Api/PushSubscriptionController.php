<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use App\Services\WebPushService;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    /**
     * Get the VAPID Public Key for WebPush subscriptions.
     */
    public function vapidPublicKey(WebPushService $webPushService)
    {
        $keys = $webPushService->getOrGenerateVapidKeys();

        return response()->json([
            'public_key' => $keys['publicKey'] ?? null,
        ]);
    }

    /**
     * Store or update a push subscription for the authenticated user.
     */
    public function store(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|url',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
            'content_encoding' => 'nullable|string',
        ]);

        $endpoint = $request->input('endpoint');
        $endpointHash = hash('sha256', $endpoint);

        $subscription = PushSubscription::updateOrCreate(
            [
                'endpoint_hash' => $endpointHash,
            ],
            [
                'user_id' => $request->user()->id,
                'endpoint' => $endpoint,
                'public_key' => $request->input('keys.p256dh'),
                'auth_token' => $request->input('keys.auth'),
                'content_encoding' => $request->input('content_encoding', 'aes128gcm'),
            ]
        );

        return response()->json([
            'message' => 'Push subscription saved successfully',
            'subscription' => $subscription,
        ], 201);
    }

    /**
     * Delete a push subscription.
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        $endpoint = $request->input('endpoint');
        $endpointHash = hash('sha256', $endpoint);

        $deleted = PushSubscription::where('user_id', $request->user()->id)
            ->where(function ($query) use ($endpoint, $endpointHash) {
                $query->where('endpoint_hash', $endpointHash)
                    ->orWhere('endpoint', $endpoint);
            })
            ->delete();

        return response()->json([
            'message' => 'Push subscription removed successfully',
            'deleted' => (bool) $deleted,
        ]);
    }

    /**
     * Send a test push notification to the authenticated user.
     */
    public function sendTestNotification(Request $request, WebPushService $webPushService)
    {
        $user = $request->user();

        $result = $webPushService->sendNotification(
            $user,
            'Battery Shop Notification',
            'Real-time push notifications are working perfectly on your device!',
            '/logo.png',
            '/notifications',
            ['type' => 'test_notification']
        );

        return response()->json([
            'message' => 'Test push notification dispatched',
            'result' => $result,
        ]);
    }
}
