<?php

namespace Tests\Unit;

use App\Services\MediaStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaStorageTest extends TestCase
{
    private const PUBLIC_URL = 'https://demo-ref.supabase.co/storage/v1/object/public/media';

    private MediaStorage $media;

    protected function setUp(): void
    {
        parent::setUp();

        config(['filesystems.media_disk' => 'supabase']);
        Storage::fake('supabase', ['url' => self::PUBLIC_URL]);
        Storage::fake('public');

        $this->media = new MediaStorage();
    }

    public function test_store_writes_uploaded_file_to_configured_media_disk(): void
    {
        $path = $this->media->store(UploadedFile::fake()->create('note.webm', 5, 'audio/webm'), 'voice_notes');

        $this->assertStringStartsWith('voice_notes/', $path);
        Storage::disk('supabase')->assertExists($path);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_put_writes_raw_contents_and_returns_path(): void
    {
        $path = $this->media->put('gps_photos/a.jpg', 'jpeg-bytes');

        $this->assertSame('gps_photos/a.jpg', $path);
        $this->assertSame('jpeg-bytes', Storage::disk('supabase')->get($path));
    }

    public function test_delete_removes_file_and_ignores_empty_paths(): void
    {
        Storage::disk('supabase')->put('voice_notes/x.webm', 'audio');

        $this->media->delete('voice_notes/x.webm');
        $this->media->delete(null);
        $this->media->delete('');

        Storage::disk('supabase')->assertMissing('voice_notes/x.webm');
    }

    public function test_url_returns_null_for_empty_path(): void
    {
        $this->assertNull($this->media->url(null));
        $this->assertNull($this->media->url(''));
    }

    public function test_url_returns_absolute_urls_unchanged(): void
    {
        $url = 'https://example.com/file.jpg';

        $this->assertSame($url, $this->media->url($url));
    }

    public function test_url_uses_supabase_public_url_for_relative_paths(): void
    {
        $this->assertSame(
            self::PUBLIC_URL . '/voice_notes/x.webm',
            $this->media->url('voice_notes/x.webm')
        );
    }

    public function test_url_uses_storage_symlink_when_media_disk_is_local(): void
    {
        config(['filesystems.media_disk' => 'public']);

        $this->assertSame(asset('storage/gps_photos/a.jpg'), $this->media->url('gps_photos/a.jpg'));
    }

    public function test_supabase_disk_is_configured_for_s3_compatible_api(): void
    {
        $disk = config('filesystems.disks.supabase');

        $this->assertSame('s3', $disk['driver']);
        $this->assertTrue($disk['use_path_style_endpoint']);
        $this->assertTrue($disk['throw']);
        $this->assertArrayNotHasKey('visibility', $disk);
    }

    public function test_supabase_disk_builds_with_s3_driver_and_public_url(): void
    {
        // Building the adapter does not touch the network.
        $disk = Storage::build(array_merge(config('filesystems.disks.supabase'), [
            'key'      => 'test-key',
            'secret'   => 'test-secret',
            'bucket'   => 'media',
            'endpoint' => 'https://demo-ref.supabase.co/storage/v1/s3',
            'url'      => self::PUBLIC_URL,
        ]));

        $this->assertInstanceOf(\Illuminate\Filesystem\AwsS3V3Adapter::class, $disk);
        $this->assertSame(self::PUBLIC_URL . '/gps_photos/a.jpg', $disk->url('gps_photos/a.jpg'));
    }
}
