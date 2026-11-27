<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Product;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_registering_job_notifies_all_staff_and_normalizes_inputs(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $staff1 = User::factory()->create(['role' => 'staff', 'name' => 'Staff One']);
        $staff2 = User::factory()->create(['role' => 'staff', 'name' => 'Staff Two']);

        Sanctum::actingAs($admin);

        // Reject non-10-digit mobile
        $badRes = $this->postJson('/api/services', [
            'customer_name' => 'ganesh kumar',
            'contact_number' => '12345',
        ]);
        $badRes->assertStatus(422);

        // Register valid job
        $res = $this->postJson('/api/services', [
            'customer_name' => 'ganesh kumar',
            'contact_number' => '+91 98765 43210',
            'address' => 'main road, tuticorin',
            'complaint_type' => 'new connection',
            'complaint_details' => 'need inverter setup',
        ]);
        $res->assertStatus(201)
            ->assertJsonPath('customer_name', 'Ganesh Kumar')
            ->assertJsonPath('contact_number', '9876543210')
            ->assertJsonPath('address', 'Main road, tuticorin')
            ->assertJsonPath('complaint_type', 'New Connection')
            ->assertJsonPath('complaint_details', 'Need inverter setup');

        $this->assertDatabaseHas('notifications', [
            'user_id' => $staff1->id,
            'type' => 'SERVICE',
            'title' => 'New Service Registered',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $staff2->id,
            'type' => 'SERVICE',
            'title' => 'New Service Registered',
        ]);
    }

    public function test_staff_updates_notify_all_admins_and_clear_notifications_endpoint_works(): void
    {
        $admin1 = User::factory()->create(['role' => 'admin']);
        $admin2 = User::factory()->create(['role' => 'admin']);
        $staff = User::factory()->create(['role' => 'staff', 'name' => 'Ravi']);

        $service = Service::create([
            'customer_name' => 'Suresh',
            'contact_number' => '9876543210',
            'vehicle_details' => 'N/A',
            'status' => 'Pending',
        ]);

        Sanctum::actingAs($staff);

        // 1. Staff picks up job -> notifies all admins
        $this->postJson("/api/services/{$service->id}/pickup")->assertStatus(200);
        $this->assertDatabaseHas('notifications', ['user_id' => $admin1->id, 'title' => 'Job Picked Up']);
        $this->assertDatabaseHas('notifications', ['user_id' => $admin2->id, 'title' => 'Job Picked Up']);

        // 2. Staff updates sub_status -> notifies all admins
        $this->putJson("/api/services/{$service->id}", [
            'sub_status' => 'battery testing',
            'notes' => 'checking voltage',
        ])->assertStatus(200);
        $this->assertDatabaseHas('notifications', ['user_id' => $admin1->id, 'title' => 'Progress Updated']);
        $this->assertDatabaseHas('notifications', ['user_id' => $admin2->id, 'title' => 'Progress Updated']);

        // 3. Staff bills a product -> notifies all admins
        $product = Product::create([
            'brand' => 'Exide',
            'model' => 'IT500',
            'type' => 'Inverter',
            'ah' => '150',
            'price' => 12000,
            'stock' => 5,
            'min_stock' => 1,
        ]);
        $this->postJson('/api/sales', [
            'customer_name' => 'suresh raina',
            'customer_phone' => '9876543210',
            'total_amount' => 12000,
            'items' => [
                ['product_id' => $product->id, 'service_id' => $service->id, 'quantity' => 1, 'price' => 12000],
            ],
        ])->assertStatus(201);
        $this->assertDatabaseHas('notifications', ['user_id' => $admin1->id, 'title' => 'Staff Billed Product']);

        // Admin clears all notifications
        Sanctum::actingAs($admin1);
        $this->deleteJson('/api/notifications')->assertStatus(200);
        $this->assertEquals(0, Notification::where('user_id', $admin1->id)->count());
        $this->assertGreaterThan(0, Notification::where('user_id', $admin2->id)->count());
    }
}
