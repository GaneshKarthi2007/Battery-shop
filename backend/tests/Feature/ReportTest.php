<?php

namespace Tests\Feature;

use App\Models\Sale;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_fetch_reports_including_quotations()
    {
        $user = User::factory()->create(['role' => 'admin']);

        Sale::create([
            'customer_name' => 'Alice Customer',
            'customer_phone' => '9876543210',
            'vehicle_details' => 'TN01AB1234',
            'payment_method' => 'Cash',
            'total_amount' => 5000,
            'type' => 'Sale',
        ]);

        Sale::create([
            'customer_name' => 'Bob Quotation User',
            'customer_phone' => '9876543211',
            'vehicle_details' => 'TN02CD5678',
            'payment_method' => 'Quotation',
            'total_amount' => 12000,
            'type' => 'Quotation',
        ]);

        Service::create([
            'customer_name' => 'Charlie Service User',
            'contact_number' => '9876543212',
            'vehicle_details' => 'TN03EF9012',
            'complaint_type' => 'Battery Charging',
            'status' => 'completed',
            'service_charge' => 800,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/reports');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'invoices',
            'summary' => [
                'totalSales',
                'totalGST',
                'totalProfit',
                'invoiceCount',
                'salesByType' => ['Sale', 'Exchange', 'Service', 'Quotation']
            ]
        ]);

        $invoices = $response->json('invoices');
        $this->assertCount(3, $invoices);
    }
}
