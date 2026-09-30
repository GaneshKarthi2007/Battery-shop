<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceManagerAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_user_with_service_manager_role(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $payload = [
            'name' => 'Service Manager John',
            'email' => 'servicemanager@example.com',
            'password' => 'secret123',
            'role' => 'service_manager',
        ];

        $response = $this->postJson('/api/users', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'Service Manager John',
                'role' => 'service_manager',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'servicemanager@example.com',
            'role' => 'service_manager',
        ]);
    }

    public function test_service_manager_access_and_complete_service_flow(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'name' => 'Admin Boss']);
        $serviceManager = User::factory()->create(['role' => 'service_manager', 'name' => 'Manager Alex']);
        $staff = User::factory()->create(['role' => 'staff', 'name' => 'Technician Bob']);

        // Step 1: Admin creates job card
        Sanctum::actingAs($admin);

        $jobCardData = [
            'customer_name' => 'Customer Dave',
            'contact_number' => '9876543210',
            'complaint_type' => 'Battery',
            'complaint_details' => 'Car not starting',
            'status' => 'Pending',
            'sub_status' => 'Job Card Created',
        ];

        $createResponse = $this->postJson('/api/services', $jobCardData);
        $createResponse->assertStatus(201);
        $serviceId = $createResponse->json('id');

        $this->assertDatabaseHas('services', [
            'id' => $serviceId,
            'customer_name' => 'Customer Dave',
            'contact_number' => '9876543210',
            'status' => 'Pending',
            'assigned_to' => null,
        ]);

        // Step 2: Service Manager contacts customer, updates details & billing
        Sanctum::actingAs($serviceManager);

        $updateData = [
            'customer_name' => 'Dave Miller',
            'vehicle_details' => 'Honda City (TN 38 XY 9999)',
            'battery_brand' => 'Exide',
            'battery_model' => 'Matrix Red',
            'battery_capacity' => '45Ah',
            'service_charge' => 350,
            'sub_status' => 'Customer Contacted & Details Updated',
            'notes' => 'Spoke to Dave. Battery discharged, needs bench charging and refilling.',
        ];

        $updateResponse = $this->putJson("/api/services/{$serviceId}", $updateData);
        $updateResponse->assertStatus(200);

        $this->assertDatabaseHas('services', [
            'id' => $serviceId,
            'customer_name' => 'Dave Miller',
            'battery_brand' => 'Exide',
            'service_charge' => 350,
            'sub_status' => 'Customer Contacted & Details Updated',
        ]);

        $this->assertDatabaseHas('service_process_flows', [
            'service_id' => $serviceId,
            'staff_id' => $serviceManager->id,
            'sub_status' => 'Customer Contacted & Details Updated',
            'notes' => 'Spoke to Dave. Battery discharged, needs bench charging and refilling.',
        ]);

        // Step 3: Staff takes the job (Pickup)
        Sanctum::actingAs($staff);

        $pickupResponse = $this->postJson("/api/services/{$serviceId}/pickup");
        $pickupResponse->assertStatus(200);

        $this->assertDatabaseHas('services', [
            'id' => $serviceId,
            'assigned_to' => $staff->id,
            'status' => 'In Progress',
        ]);

        $this->assertDatabaseHas('service_process_flows', [
            'service_id' => $serviceId,
            'staff_id' => $staff->id,
            'sub_status' => 'Task Picked Up / Commenced',
        ]);
    }
}
