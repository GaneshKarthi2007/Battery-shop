<?php

namespace Tests\Feature;

use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_customer_directory_and_profile_ledger(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sale::create([
            'customer_name' => 'Kumar',
            'customer_phone' => '9876543210',
            'total_amount' => 4500,
            'type' => 'Sale',
            'balance_due' => 500,
        ]);

        $listResponse = $this->actingAs($admin)->getJson('/api/customers');
        $listResponse->assertStatus(200)
            ->assertJsonPath('0.name', 'Kumar')
            ->assertJsonPath('0.log_id', '1');

        // Lookup by integer log ID '1'
        $showResponse = $this->actingAs($admin)->getJson('/api/customers/1');
        $showResponse->assertStatus(200)
            ->assertJsonPath('profile.name', 'Kumar')
            ->assertJsonPath('profile.log_id', '1')
            ->assertJsonPath('profile.total_purchases', 4500);

        // Search by integer log ID
        $searchResponse = $this->actingAs($admin)->getJson('/api/customers?search=1');
        $searchResponse->assertStatus(200)
            ->assertJsonPath('0.log_id', '1');
    }

    public function test_manual_customer_log_id_and_next_sequential_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        // Check next log id endpoint
        $nextRes = $this->actingAs($admin)->getJson('/api/customers/next-log-id');
        $nextRes->assertStatus(200)
            ->assertJsonPath('next_log_id', 1);

        // Create a customer with manual integer log ID 50
        $createRes = $this->actingAs($admin)->postJson('/api/customers', [
            'name' => 'Murugan',
            'phone' => '9894127699',
            'log_id' => '50',
        ]);
        $createRes->assertStatus(201)
            ->assertJsonPath('customer_code', '50')
            ->assertJsonPath('log_id', '50');

        // Next auto-generated log ID must now automatically be 51
        $nextResAfter = $this->actingAs($admin)->getJson('/api/customers/next-log-id');
        $nextResAfter->assertStatus(200)
            ->assertJsonPath('next_log_id', 51);

        // Reject non-integer log IDs
        $invalidRes = $this->actingAs($admin)->postJson('/api/customers', [
            'name' => 'Invalid Log',
            'phone' => '9894127698',
            'log_id' => 'abc',
        ]);
        $invalidRes->assertStatus(422);
    }
}
