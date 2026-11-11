<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_users_cannot_access_users_endpoints(): void
    {
        $this->getJson('/api/users')->assertStatus(401);
        $this->postJson('/api/users', [])->assertStatus(401);
    }

    public function test_staff_users_cannot_access_user_management(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        Sanctum::actingAs($staff);

        $this->getJson('/api/users')->assertStatus(403);
        $this->postJson('/api/users', [
            'name' => 'New Staff',
            'email' => 'newstaff@example.com',
            'password' => 'password123',
            'role' => 'staff',
        ])->assertStatus(403);
    }

    public function test_manager_users_cannot_access_user_management(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);
        Sanctum::actingAs($manager);

        $this->getJson('/api/users')->assertStatus(403);
        $this->postJson('/api/users', [
            'name' => 'New Staff',
            'email' => 'newstaff@example.com',
            'password' => 'password123',
            'role' => 'staff',
        ])->assertStatus(403);
    }

    public function test_developer_can_list_users(): void
    {
        $developer = User::factory()->create(['role' => 'developer']);
        Sanctum::actingAs($developer);

        User::factory()->create(['name' => 'Alice Staff', 'role' => 'staff']);
        User::factory()->create(['name' => 'Bob Admin', 'role' => 'admin']);

        $response = $this->getJson('/api/users');

        $response->assertOk()
            ->assertJsonCount(3) // developer + Alice + Bob
            ->assertJsonFragment(['name' => 'Alice Staff'])
            ->assertJsonFragment(['name' => 'Bob Admin']);
    }

    public function test_developer_can_create_user_with_developer_role(): void
    {
        $developer = User::factory()->create(['role' => 'developer']);
        Sanctum::actingAs($developer);

        $payload = [
            'name' => 'New Dev User',
            'email' => 'newdev@example.com',
            'password' => 'secret123',
            'role' => 'developer',
        ];

        $response = $this->postJson('/api/users', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'New Dev User',
                'email' => 'newdev@example.com',
                'role' => 'developer',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'newdev@example.com',
            'role' => 'developer',
        ]);
    }

    public function test_developer_can_create_user_with_admin_or_staff_role(): void
    {
        $developer = User::factory()->create(['role' => 'developer']);
        Sanctum::actingAs($developer);

        $payload = [
            'name' => 'New Admin User',
            'email' => 'newadmin@example.com',
            'password' => 'secret123',
            'role' => 'admin',
        ];

        $response = $this->postJson('/api/users', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'New Admin User',
                'role' => 'admin',
            ]);
    }

    public function test_admin_can_create_user_with_manager_role(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $payload = [
            'name' => 'Store Manager',
            'email' => 'manager@example.com',
            'password' => 'manager123',
            'role' => 'manager',
        ];

        $response = $this->postJson('/api/users', $payload);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'name' => 'Store Manager',
                'email' => 'manager@example.com',
                'role' => 'manager',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'manager@example.com',
            'role' => 'manager',
        ]);
    }

    public function test_user_creation_validates_required_fields_and_unique_email(): void
    {
        $developer = User::factory()->create(['role' => 'developer', 'email' => 'existing@example.com']);
        Sanctum::actingAs($developer);

        // Missing fields
        $this->postJson('/api/users', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password', 'role']);

        // Invalid role
        $this->postJson('/api/users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'role' => 'superman',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['role']);

        // Duplicate email
        $this->postJson('/api/users', [
            'name' => 'Test User',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'role' => 'staff',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_developer_can_update_user(): void
    {
        $developer = User::factory()->create(['role' => 'developer']);
        Sanctum::actingAs($developer);

        $targetUser = User::factory()->create(['role' => 'staff', 'name' => 'Old Name']);

        $response = $this->putJson("/api/users/{$targetUser->id}", [
            'name' => 'Updated Name',
            'role' => 'admin',
        ]);

        $response->assertOk()
            ->assertJsonFragment([
                'id' => $targetUser->id,
                'name' => 'Updated Name',
                'role' => 'admin',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $targetUser->id,
            'name' => 'Updated Name',
            'role' => 'admin',
        ]);
    }

    public function test_developer_can_delete_another_user(): void
    {
        $developer = User::factory()->create(['role' => 'developer']);
        Sanctum::actingAs($developer);

        $targetUser = User::factory()->create(['role' => 'staff']);

        $response = $this->deleteJson("/api/users/{$targetUser->id}");

        $response->assertOk()
            ->assertJsonFragment(['message' => 'User deleted successfully.']);

        $this->assertDatabaseMissing('users', ['id' => $targetUser->id]);
    }

    public function test_developer_cannot_delete_self(): void
    {
        $developer = User::factory()->create(['role' => 'developer']);
        Sanctum::actingAs($developer);

        $response = $this->deleteJson("/api/users/{$developer->id}");

        $response->assertStatus(400)
            ->assertJsonFragment(['message' => 'You cannot delete your own account.']);

        $this->assertDatabaseHas('users', ['id' => $developer->id]);
    }

    public function test_admin_cannot_see_developer_users(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->create(['name' => 'Secret Dev', 'role' => 'developer']);
        User::factory()->create(['name' => 'Regular Staff', 'role' => 'staff']);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/users');
        $response->assertOk()
            ->assertJsonMissing(['name' => 'Secret Dev'])
            ->assertJsonFragment(['name' => 'Regular Staff']);
    }

    public function test_admin_cannot_create_developer_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/users', [
            'name' => 'Sneaky Dev',
            'email' => 'sneakydev@example.com',
            'password' => 'secret123',
            'role' => 'developer',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    public function test_admin_cannot_modify_or_delete_developer_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $dev = User::factory()->create(['name' => 'Master Dev', 'role' => 'developer']);

        Sanctum::actingAs($admin);

        // Cannot update
        $updateRes = $this->putJson("/api/users/{$dev->id}", [
            'name' => 'Hacked Dev',
        ]);
        $updateRes->assertStatus(403);

        // Cannot delete
        $delRes = $this->deleteJson("/api/users/{$dev->id}");
        $delRes->assertStatus(403);

        $this->assertDatabaseHas('users', ['id' => $dev->id]);
    }
}
