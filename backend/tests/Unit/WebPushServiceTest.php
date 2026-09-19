<?php

namespace Tests\Unit;

use App\Models\PushSubscription;
use App\Models\User;
use App\Services\WebPushService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebPushServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_notification_returns_zero_counts_when_user_has_no_subscriptions(): void
    {
        $user = User::factory()->create();
        $service = new WebPushService();

        $result = $service->sendNotification($user, 'Test Title', 'Test Body');

        $this->assertEquals(['success' => 0, 'failed' => 0], $result);
    }

    public function test_send_notification_dispatches_for_subscribed_user(): void
    {
        $user = User::factory()->create();

        PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/test-sub-1',
            'endpoint_hash' => hash('sha256', 'https://fcm.googleapis.com/fcm/send/test-sub-1'),
            'public_key' => 'pub_1',
            'auth_token' => 'auth_1',
        ]);

        $service = new WebPushService();
        $result = $service->sendNotification($user, 'New Service Job', 'Service job #101 assigned to you');

        $this->assertEquals(1, $result['success']);
        $this->assertEquals(0, $result['failed']);
    }
}
