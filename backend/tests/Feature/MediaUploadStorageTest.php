<?php

namespace Tests\Feature;

use App\Models\GpsPhoto;
use App\Models\MiscTransaction;
use App\Models\Service;
use App\Models\ServiceProcessFlow;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Every media upload must land on the configured media disk (Supabase in
 * production) and the API must return a full public URL for it.
 */
class MediaUploadStorageTest extends TestCase
{
    use RefreshDatabase;

    private const PUBLIC_URL = 'https://demo-ref.supabase.co/storage/v1/object/public/media';

    protected function setUp(): void
    {
        parent::setUp();

        config(['filesystems.media_disk' => 'supabase']);
        Storage::fake('supabase', ['url' => self::PUBLIC_URL]);
        Storage::fake('public');
    }

    private function pendingService(): Service
    {
        return Service::create([
            'customer_name'   => 'Rajesh',
            'contact_number'  => '9894127692',
            'vehicle_details' => 'Toyota Fortuner',
            'status'          => 'Pending',
        ]);
    }

    // --- Voice notes ---

    public function test_unauthenticated_users_cannot_upload_voice_notes(): void
    {
        $service = $this->pendingService();

        $this->postJson("/api/services/{$service->id}/voice-note", [
            'voice_note' => UploadedFile::fake()->create('note.webm', 5, 'audio/webm'),
        ])->assertStatus(401);
    }

    public function test_voice_note_upload_requires_a_file(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'staff']));
        $service = $this->pendingService();

        $this->postJson("/api/services/{$service->id}/voice-note", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('voice_note');
    }

    public function test_voice_note_is_stored_in_supabase_and_url_is_returned(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'staff']));
        $service = $this->pendingService();

        $response = $this->post("/api/services/{$service->id}/voice-note", [
            'voice_note' => UploadedFile::fake()->create('note.webm', 5, 'audio/webm'),
        ], ['Accept' => 'application/json'])->assertOk();

        $path = $service->fresh()->voice_note;

        $this->assertStringStartsWith('voice_notes/', $path);
        Storage::disk('supabase')->assertExists($path);
        Storage::disk('public')->assertMissing($path);
        $response->assertJsonPath('voice_note_url', self::PUBLIC_URL . '/' . $path);
    }

    public function test_deleting_a_process_flow_removes_its_voice_note_from_supabase(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        Sanctum::actingAs($staff);
        $service = $this->pendingService();

        Storage::disk('supabase')->put('voice_notes/flow.webm', 'audio');
        $flow = ServiceProcessFlow::create([
            'service_id' => $service->id,
            'sub_status' => 'Staff Update',
            'staff_id'   => $staff->id,
            'voice_note' => 'voice_notes/flow.webm',
        ]);

        $this->assertSame(self::PUBLIC_URL . '/voice_notes/flow.webm', $flow->voice_note_url);

        $this->deleteJson("/api/service-flows/{$flow->id}")->assertOk();

        Storage::disk('supabase')->assertMissing('voice_notes/flow.webm');
    }

    // --- GPS photos ---

    public function test_gps_photo_is_stored_in_supabase_and_deleted_with_record(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'staff']));

        $response = $this->post('/api/gps-photos', [
            'image'       => UploadedFile::fake()->image('site.jpg', 640, 480),
            'latitude'    => 11.0168,
            'longitude'   => 76.9558,
            'captured_at' => '2026-11-11 10:00:00',
        ], ['Accept' => 'application/json'])->assertCreated();

        $photo = GpsPhoto::firstOrFail();

        $this->assertStringStartsWith('gps_photos/', $photo->image_path);
        Storage::disk('supabase')->assertExists($photo->image_path);
        Storage::disk('public')->assertMissing($photo->image_path);
        $response->assertJsonPath('image_url', self::PUBLIC_URL . '/' . $photo->image_path);

        $this->deleteJson("/api/gps-photos/{$photo->id}")->assertNoContent();

        Storage::disk('supabase')->assertMissing($photo->image_path);
    }

    // --- Misc transaction attachments ---

    public function test_misc_transaction_attachment_is_stored_in_supabase_and_deleted_with_record(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->post('/api/misc-transactions', [
            'date'           => '2026-11-11',
            'type'           => 'Journal',
            'particular'     => 'UPS BATTERY MAINTENANCE',
            'credit_entries' => [['ledger' => 'CASH', 'amount' => 500]],
            'debit_entries'  => [['ledger' => 'OFFICE CONSUMABLES', 'amount' => 500]],
            'attachment'     => UploadedFile::fake()->create('bill.pdf', 20, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $transaction = MiscTransaction::where('particular', 'UPS BATTERY MAINTENANCE')->firstOrFail();
        $path = $transaction->attachment_path;

        $this->assertStringStartsWith('misc-transactions/', $path);
        Storage::disk('supabase')->assertExists($path);
        $response->assertJsonPath('data.attachment_url', self::PUBLIC_URL . '/' . $path);

        $this->deleteJson("/api/misc-transactions/{$transaction->id}")->assertOk();

        Storage::disk('supabase')->assertMissing($path);
    }
}
