<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_fetch_dashboard_analytics_with_timeframe(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        // Create sample product
        $product = Product::create([
            'brand' => 'Amaron',
            'model' => 'Flo 42B20R',
            'type' => 'Automotive',
            'ah' => '35Ah',
            'price' => 4500,
            'purchase_price' => 3500,
            'stock' => 10,
            'min_stock' => 2,
        ]);

        // Create sale
        Sale::create([
            'customer_name' => 'John Doe',
            'total_amount' => 4500,
            'type' => 'Sale',
            'payment_method' => 'Cash',
            'payment_status' => 'paid',
            'balance_due' => 0,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/dashboard?timeframe=today');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'todaySales',
                'todayProfit',
                'pendingPayments',
                'todayExchangesCount',
                'todayServicesCount',
                'lowStockCount',
                'outstandingCustomerBalance',
                'timeframe',
                'paymentMethodBreakdown',
                'gstBreakdown',
                'topSellingBatteries',
                'trendData',
            ]);
    }
}
