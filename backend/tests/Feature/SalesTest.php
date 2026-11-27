<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SalesTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_sale_even_when_product_stock_is_zero()
    {
        $user = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($user);

        $product = Product::create([
            'type' => 'Battery',
            'brand' => 'Exide',
            'model' => 'Matrix 35Ah',
            'ah' => '35Ah',
            'price' => 4500,
            'stock' => 0,
            'min_stock' => 5,
            'stock_status' => 'out_of_stock',
        ]);

        $payload = [
            'customer_name' => 'John Doe',
            'customer_phone' => '9876543210',
            'total_amount' => 4500,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'price' => 4500,
                ],
            ],
        ];

        $response = $this->postJson('/api/sales', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('sales', [
            'customer_name' => 'John Doe',
            'total_amount' => 4500,
        ]);

        $product->refresh();
        $this->assertEquals(-2, $product->stock);
        $this->assertEquals('out_of_stock', $product->stock_status);
    }

    public function test_can_convert_service_order_when_product_stock_is_zero()
    {
        $user = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($user);

        $product = Product::create([
            'type' => 'Battery',
            'brand' => 'Amaron',
            'model' => 'Pro 45Ah',
            'ah' => '45Ah',
            'price' => 5000,
            'stock' => 0,
            'min_stock' => 2,
            'stock_status' => 'out_of_stock',
        ]);

        $service = \App\Models\Service::create([
            'customer_name' => 'Jane Smith',
            'contact_number' => '9876543211',
            'vehicle_details' => 'Car',
            'status' => 'Converted to Order',
        ]);

        $payload = [
            'product_id' => $product->id,
            'quantity' => 1,
        ];

        $response = $this->postJson("/api/services/{$service->id}/process-converted-order", $payload);

        $response->assertStatus(200);

        $product->refresh();
        $this->assertEquals(-1, $product->stock);
        $this->assertEquals('out_of_stock', $product->stock_status);
    }

    public function test_staff_can_bill_product_for_new_connection_keeping_service_in_progress()
    {
        $staff = User::factory()->create(['role' => 'staff']);
        Sanctum::actingAs($staff);

        $product = Product::create([
            'type' => 'Inverter',
            'brand' => 'Luminous',
            'model' => 'RedCharge 18000',
            'ah' => '150Ah',
            'price' => 11500,
            'stock' => 4,
            'min_stock' => 1,
            'stock_status' => 'in_stock',
        ]);

        $service = \App\Models\Service::create([
            'customer_name' => 'Karthik Nair',
            'contact_number' => '9876543299',
            'vehicle_details' => 'N/A',
            'complaint_type' => 'New Connection',
            'status' => 'In Progress',
            'assigned_to' => $staff->id,
        ]);

        $payload = [
            'customer_name' => 'Karthik Nair',
            'customer_phone' => '9876543299',
            'product_category' => 'New Connection',
            'type' => 'Sale',
            'total_amount' => 13570,
            'items' => [
                [
                    'product_id' => $product->id,
                    'service_id' => $service->id,
                    'quantity' => 1,
                    'price' => 11500,
                ],
            ],
        ];

        $response = $this->postJson('/api/sales', $payload);
        $response->assertStatus(201);

        $service->refresh();
        $this->assertEquals('In Progress', $service->status);
        $this->assertEquals('Luminous', $service->battery_brand);
        $this->assertEquals('RedCharge 18000', $service->battery_model);

        $listResponse = $this->getJson('/api/services');
        $listResponse->assertStatus(200)
            ->assertJsonCount(1, '0.sales');
    }
}
