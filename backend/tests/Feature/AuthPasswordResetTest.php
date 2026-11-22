<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthPasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_password_reset_code(): void
    {
        $user = User::factory()->create([
            'email' => 'tech@battery.com',
        ]);

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'tech@battery.com',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message', 'debug_token']);

        $tokenRecord = DB::table('password_reset_tokens')->where('email', 'tech@battery.com')->first();
        $this->assertNotNull($tokenRecord);
    }

    public function test_forgot_password_with_unknown_email_returns_safe_message(): void
    {
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'unknown@battery.com',
        ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'If an account exists with this email, a reset code has been sent.',
            ]);
    }

    public function test_forgot_password_validates_email_format(): void
    {
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'not-an-email',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_reset_password_with_valid_token_and_login_with_new_password(): void
    {
        $user = User::factory()->create([
            'email' => 'staff@battery.com',
            'password' => 'oldpassword123',
        ]);

        $forgotResponse = $this->postJson('/api/forgot-password', [
            'email' => 'staff@battery.com',
        ]);

        $code = $forgotResponse->json('debug_token');
        $this->assertNotEmpty($code);

        $resetResponse = $this->postJson('/api/reset-password', [
            'email' => 'staff@battery.com',
            'token' => $code,
            'password' => 'newsecurepassword',
            'password_confirmation' => 'newsecurepassword',
        ]);

        $resetResponse->assertOk()
            ->assertJson([
                'message' => 'Password has been reset successfully. You can now login.',
            ]);

        // Token should be cleared
        $this->assertNull(DB::table('password_reset_tokens')->where('email', 'staff@battery.com')->first());

        // Can login with new password
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'staff@battery.com',
            'password' => 'newsecurepassword',
        ]);

        $loginResponse->assertOk()
            ->assertJsonStructure(['access_token', 'user']);
    }

    public function test_reset_password_fails_with_invalid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@battery.com',
            'password' => 'secret123',
        ]);

        $this->postJson('/api/forgot-password', [
            'email' => 'admin@battery.com',
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => 'admin@battery.com',
            'token' => '999999-wrong',
            'password' => 'newsecret123',
            'password_confirmation' => 'newsecret123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }

    public function test_reset_password_fails_with_expired_token(): void
    {
        $user = User::factory()->create([
            'email' => 'expired@battery.com',
        ]);

        DB::table('password_reset_tokens')->insert([
            'email' => 'expired@battery.com',
            'token' => Hash::make('123456'),
            'created_at' => Carbon::now()->subMinutes(65),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => 'expired@battery.com',
            'token' => '123456',
            'password' => 'newsecret123',
            'password_confirmation' => 'newsecret123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }

    public function test_reset_password_validates_password_confirmation(): void
    {
        $response = $this->postJson('/api/reset-password', [
            'email' => 'test@battery.com',
            'token' => '123456',
            'password' => 'password123',
            'password_confirmation' => 'mismatch456',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
