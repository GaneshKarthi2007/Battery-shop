<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use App\Models\ServiceProcessFlow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_unauthorized_users_cannot_access_services()
    {
        $response = $this->getJson('/api/services');
        $response->assertStatus(401);
    }

    public function test_fetch_available_complaints_only()
    {
        $staff = User::factory()->create(['role' => 'staff']);
        Sanctum::actingAs($staff);

        // Available service
        $s1 = Service::create([
            'customer_name' => 'Rajesh',
            'contact_number' => '9894127692',
            'vehicle_details' => 'Toyota Fortuner',
            'status' => 'Pending',
        ]);

        // Already assigned/taken service
        $s2 = Service::create([
            'customer_name' => 'Priya',
            'contact_number' => '9894127693',
            'vehicle_details' => 'Honda City',
            'status' => 'In Progress',
            'assigned_to' => User::factory()->create()->id,
        ]);

        // Completed/Closed service
        $s3 = Service::create([
            'customer_name' => 'Amit',
            'contact_number' => '9894127694',
            'vehicle_details' => 'Activa',
            'status' => 'Completed',
        ]);

        $response = $this->getJson('/api/services?available=1');
        $response->assertStatus(200);
        $data = $response->json();

        $this->assertCount(1, $data);
        $this->assertEquals($s1->id, $data[0]['id']);
    }

    public function test_search_complaints_by_id_or_mobile()
    {
        $staff = User::factory()->create(['role' => 'staff']);
        Sanctum::actingAs($staff);

        $s1 = Service::create([
            'customer_name' => 'Rajesh',
            'contact_number' => '9894127692',
            'vehicle_details' => 'Toyota Fortuner',
            'status' => 'Pending',
        ]);

        $s2 = Service::create([
            'customer_name' => 'Priya',
            'contact_number' => '9123456780',
            'vehicle_details' => 'Honda City',
            'status' => 'Pending',
        ]);

        // Search by phone
        $response = $this->getJson('/api/services?search=9894127692');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json());
        $this->assertEquals($s1->id, $response->json()[0]['id']);

        // Search by name
        $response = $this->getJson('/api/services?search=Priya');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json());
        $this->assertEquals($s2->id, $response->json()[0]['id']);
    }

    public function test_view_selected_complaint_details()
    {
        $staff = User::factory()->create(['role' => 'staff']);
        Sanctum::actingAs($staff);

        $service = Service::create([
            'customer_name' => 'Rajesh',
            'contact_number' => '9894127692',
            'vehicle_details' => 'Toyota Fortuner',
            'status' => 'Pending',
            'complaint_type' => 'Dead Battery',
            'complaint_details' => 'Vehicle is not starting.',
        ]);

        $response = $this->getJson("/api/services/{$service->id}");
        $response->assertStatus(200);
        $response->assertJsonFragment([
            'customer_name' => 'Rajesh',
            'complaint_type' => 'Dead Battery',
        ]);
    }

    public function test_accept_an_available_complaint()
    {
        $staff = User::factory()->create(['role' => 'staff']);
        Sanctum::actingAs($staff);

        $service = Service::create([
            'customer_name' => 'Rajesh',
            'contact_number' => '9894127692',
            'vehicle_details' => 'Toyota Fortuner',
            'status' => 'Pending',
        ]);

        $response = $this->postJson("/api/services/{$service->id}/pickup");
        $response->assertStatus(200);

        // Assert DB matches
        $service->refresh();
        $this->assertEquals($staff->id, $service->assigned_to);
        $this->assertEquals('In Progress', $service->status);
        $this->assertNotNull($service->assigned_at);

        // Assert timeline process flow record is created
        $this->assertTrue(ServiceProcessFlow::where('service_id', $service->id)
            ->where('sub_status', 'Task Picked Up / Commenced')
            ->where('staff_id', $staff->id)
            ->exists());
    }

    public function test_cannot_accept_already_accepted_complaint()
    {
        $staff1 = User::factory()->create(['role' => 'staff']);
        $staff2 = User::factory()->create(['role' => 'staff']);

        $service = Service::create([
            'customer_name' => 'Rajesh',
            'contact_number' => '9894127692',
            'vehicle_details' => 'Toyota Fortuner',
            'status' => 'In Progress',
            'assigned_to' => $staff1->id,
        ]);

        Sanctum::actingAs($staff2);

        $response = $this->postJson("/api/services/{$service->id}/pickup");
        $response->assertStatus(400);
        $response->assertJsonFragment([
            'message' => 'This complaint has already been accepted by another staff member.'
        ]);
    }

    public function test_cannot_accept_closed_complaint()
    {
        $staff = User::factory()->create(['role' => 'staff']);
        Sanctum::actingAs($staff);

        $service = Service::create([
            'customer_name' => 'Rajesh',
            'contact_number' => '9894127692',
            'vehicle_details' => 'Toyota Fortuner',
            'status' => 'Completed',
        ]);

        $response = $this->postJson("/api/services/{$service->id}/pickup");
        $response->assertStatus(400);
        $response->assertJsonFragment([
            'message' => 'Cannot accept a closed or cancelled complaint.'
        ]);
    }

    public function test_cannot_accept_cancelled_complaint()
    {
        $staff = User::factory()->create(['role' => 'staff']);
        Sanctum::actingAs($staff);

        $service = Service::create([
            'customer_name' => 'Rajesh',
            'contact_number' => '9894127692',
            'vehicle_details' => 'Toyota Fortuner',
            'status' => 'Cancelled',
        ]);

        $response = $this->postJson("/api/services/{$service->id}/pickup");
        $response->assertStatus(400);
        $response->assertJsonFragment([
            'message' => 'Cannot accept a closed or cancelled complaint.'
        ]);
    }
}
