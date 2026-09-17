<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use App\Models\WarrantyClaim;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WarrantyClaimTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_and_update_warranty_claim(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $product = Product::create([
            'brand' => 'Exide',
            'model' => 'Matrix 35Ah',
            'type' => 'Automotive',
            'ah' => '35Ah',
            'price' => 5000,
            'stock' => 5,
            'min_stock' => 1,
        ]);

        $createResponse = $this->actingAs($admin)->postJson('/api/warranty-claims', [
            'serial_number' => 'EX-987654321',
            'customer_name' => 'Kumar',
            'customer_phone' => '9876543210',
            'issue_description' => 'Battery not holding charge',
            'claim_type' => 'replacement',
            'product_id' => $product->id,
        ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('serial_number', 'EX-987654321')
            ->assertJsonPath('status', 'pending_inspection');

        $claimId = $createResponse->json('id');

        $updateResponse = $this->actingAs($admin)->putJson("/api/warranty-claims/{$claimId}", [
            'status' => 'approved',
            'inspection_notes' => 'Cell dead verified by tester',
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('status', 'approved');
    }
}
