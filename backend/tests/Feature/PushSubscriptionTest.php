<?php

namespace Tests\Feature;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PushSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_users_cannot_access_push_endpoints(): void
    {
        $this->getJson('/api/push-subscriptions/vapid-public-key')->assertStatus(401);
        $this->postJson('/api/push-subscriptions', [])->assertStatus(401);
        $this->deleteJson('/api/push-subscriptions', [])->assertStatus(401);
        $this->postJson('/api/push-subscriptions/test', [])->assertStatus(401);
    }

    public function test_authenticated_user_can_get_vapid_public_key(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        config(['webpush.vapid.public_key' => 'TEST_VAPID_PUBLIC_KEY']);

        $response = $this->getJson('/api/push-subscriptions/vapid-public-key');

        $response->assertOk()
            ->assertJson(['public_key' => 'TEST_VAPID_PUBLIC_KEY']);
    }

    public function test_authenticated_user_can_subscribe_and_store_push_subscription(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $payload = [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/test-device-token-123',
            'keys' => [
                'p256dh' => 'BDsT1v2...',
                'auth' => 'a8D9...',
            ],
            'content_encoding' => 'aes128gcm',
        ];

        $response = $this->postJson('/api/push-subscriptions', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment(['message' => 'Push subscription saved successfully']);

        $this->assertDatabaseHas('push_subscriptions', [
            'user_id' => $user->id,
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/test-device-token-123',
            'public_key' => 'BDsT1v2...',
            'auth_token' => 'a8D9...',
        ]);
    }

    public function test_subscribe_validates_required_fields(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/push-subscriptions', [
            'endpoint' => 'not-a-valid-url',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['endpoint', 'keys.p256dh', 'keys.auth']);
    }

    public function test_authenticated_user_can_unsubscribe(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $endpoint = 'https://fcm.googleapis.com/fcm/send/test-device-token-456';
        $hash = hash('sha256', $endpoint);

        PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => $endpoint,
            'endpoint_hash' => $hash,
            'public_key' => 'key123',
            'auth_token' => 'token123',
        ]);

        $response = $this->deleteJson('/api/push-subscriptions', [
            'endpoint' => $endpoint,
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Push subscription removed successfully', 'deleted' => true]);

        $this->assertDatabaseMissing('push_subscriptions', [
            'endpoint_hash' => $hash,
            'endpoint' => $endpoint,
        ]);
    }

    public function test_authenticated_user_can_trigger_test_push_notification(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => 'https://updates.push.services.mozilla.com/wpush/v1/sub-789',
            'endpoint_hash' => hash('sha256', 'https://updates.push.services.mozilla.com/wpush/v1/sub-789'),
            'public_key' => 'pubkey',
            'auth_token' => 'authtoken',
        ]);

        $response = $this->postJson('/api/push-subscriptions/test');

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Test push notification dispatched']);
    }
}
