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
            ->assertJsonPath('0.log_id', 'CUST-00001');

        // Lookup by solid log ID CUST-00001
        $showResponse = $this->actingAs($admin)->getJson('/api/customers/CUST-00001');
        $showResponse->assertStatus(200)
            ->assertJsonPath('profile.name', 'Kumar')
            ->assertJsonPath('profile.log_id', 'CUST-00001')
            ->assertJsonPath('profile.total_purchases', 4500);

        // Search by solid log ID
        $searchResponse = $this->actingAs($admin)->getJson('/api/customers?search=CUST-00001');
        $searchResponse->assertStatus(200)
            ->assertJsonPath('0.log_id', 'CUST-00001');
    }
}
