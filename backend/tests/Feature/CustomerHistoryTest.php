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
        $listResponse->assertStatus(200);

        $showResponse = $this->actingAs($admin)->getJson('/api/customers/9876543210');
        $showResponse->assertStatus(200)
            ->assertJsonPath('profile.name', 'Kumar')
            ->assertJsonPath('profile.total_purchases', 4500);
    }
}
