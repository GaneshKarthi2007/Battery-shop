<?php

namespace App\Services;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Single entry point for uploaded media (voice notes, GPS photos, attachments).
 *
 * The target disk comes from config('filesystems.media_disk') — "public" locally,
 * "supabase" in production. The database stores relative paths only
 * (e.g. voice_notes/abc.webm); use url() to turn them into a browser link.
 */
class MediaStorage
{
    public function disk(): Filesystem
    {
        return Storage::disk(config('filesystems.media_disk', 'public'));
    }

    /**
     * Store an uploaded file under $directory with a random name.
     *
     * @return string Relative path on the media disk.
     */
    public function store(UploadedFile $file, string $directory): string
    {
        $path = $this->disk()->putFile($directory, $file);

        if (! $path) {
            throw new \RuntimeException("Unable to store uploaded file in [{$directory}].");
        }

        return $path;
    }

    /**
     * Write raw contents to $path.
     *
     * @return string The same relative path.
     */
    public function put(string $path, string $contents): string
    {
        if (! $this->disk()->put($path, $contents)) {
            throw new \RuntimeException("Unable to write file [{$path}].");
        }

        return $path;
    }

    /**
     * Delete a stored file. Never throws: a storage hiccup must not block
     * deleting the database record that pointed at it.
     */
    public function delete(?string $path): void
    {
        if (! $path || $this->isAbsoluteUrl($path)) {
            return;
        }

        try {
            $this->disk()->delete($path);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Public URL for a stored path. Absolute URLs are returned unchanged.
     */
    public function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if ($this->isAbsoluteUrl($path)) {
            return $path;
        }

        // Local disks are served through the public/storage symlink; asset() follows
        // the current request host (e.g. localhost:8000) instead of APP_URL.
        if ($this->usesLocalDriver()) {
            return asset('storage/' . ltrim($path, '/'));
        }

        return $this->disk()->url($path);
    }

    private function usesLocalDriver(): bool
    {
        $name = config('filesystems.media_disk', 'public');

        return config("filesystems.disks.{$name}.driver") === 'local';
    }

    private function isAbsoluteUrl(string $path): bool
    {
        return str_starts_with($path, 'http://') || str_starts_with($path, 'https://');
    }
}
