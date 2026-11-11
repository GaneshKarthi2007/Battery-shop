<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SettingControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Setting::flushCache();
    }

    public function test_unauthenticated_users_cannot_access_settings(): void
    {
        $this->getJson('/api/settings')->assertStatus(401);
        $this->putJson('/api/settings', ['service_log_id_prefix' => 'SRV-'])->assertStatus(401);
    }

    public function test_any_authenticated_user_can_read_settings(): void
    {
        Setting::set('service_log_id_prefix', 'SRV-');
        $staff = User::factory()->create(['role' => 'staff']);
        Sanctum::actingAs($staff);

        $this->getJson('/api/settings')
            ->assertOk()
            ->assertJsonPath('service_log_id_prefix', 'SRV-')
            ->assertJsonStructure(['service_log_id_prefix', 'shop_name', 'shop_phone', 'shop_address', 'shop_gst', 'shop_email']);
    }

    public function test_staff_and_manager_cannot_update_settings(): void
    {
        foreach (['staff', 'manager'] as $role) {
            Sanctum::actingAs(User::factory()->create(['role' => $role]));
            $this->putJson('/api/settings', ['service_log_id_prefix' => 'SRV-'])->assertStatus(403);
        }
        $this->assertDatabaseMissing('settings', ['key' => 'service_log_id_prefix']);
    }

    public function test_admin_can_set_service_log_id_prefix(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->putJson('/api/settings', ['service_log_id_prefix' => 'SRV-'])
            ->assertOk()
            ->assertJsonPath('service_log_id_prefix', 'SRV-');

        $this->assertDatabaseHas('settings', ['key' => 'service_log_id_prefix', 'value' => 'SRV-']);
    }

    public function test_developer_can_set_and_clear_prefix_and_shop_details(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'developer']));

        $this->putJson('/api/settings', [
            'service_log_id_prefix' => 'JOB',
            'shop_name' => 'SMR Battery Shop',
            'shop_gst' => '33XXXXX1234X1Z5',
        ])->assertOk()
            ->assertJsonPath('service_log_id_prefix', 'JOB')
            ->assertJsonPath('shop_name', 'SMR Battery Shop');

        // Clearing the prefix
        $this->putJson('/api/settings', ['service_log_id_prefix' => ''])
            ->assertOk()
            ->assertJsonPath('service_log_id_prefix', '');
    }

    public function test_prefix_rejects_invalid_characters_and_too_long_values(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->putJson('/api/settings', ['service_log_id_prefix' => 'SRV !'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['service_log_id_prefix']);

        $this->putJson('/api/settings', ['service_log_id_prefix' => 'ABCDEFGHIJK'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['service_log_id_prefix']);
    }

    public function test_updating_settings_is_shared_across_users(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->putJson('/api/settings', ['service_log_id_prefix' => 'SRV-'])->assertOk();

        // A different user on a "different device" reads the same prefix
        Setting::flushCache();
        Sanctum::actingAs(User::factory()->create(['role' => 'staff']));
        $this->getJson('/api/settings')->assertOk()->assertJsonPath('service_log_id_prefix', 'SRV-');
    }

    public function test_service_json_includes_display_log_id_with_prefix(): void
    {
        Setting::set('service_log_id_prefix', 'SRV-');
        $staff = User::factory()->create(['role' => 'staff']);
        Sanctum::actingAs($staff);

        $service = Service::create([
            'customer_name' => 'Ganesh',
            'contact_number' => '9876543210',
            'vehicle_details' => 'N/A',
            'status' => 'Pending',
            'service_code' => '42',
        ]);

        $this->assertSame('42', $service->log_id);
        $this->assertSame('SRV-42', $service->display_log_id);

        $this->getJson("/api/services/{$service->id}")
            ->assertOk()
            ->assertJsonPath('display_log_id', 'SRV-42');
    }
}
