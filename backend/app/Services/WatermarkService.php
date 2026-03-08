<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Applies a GPS-data watermark to uploaded images using PHP GD.
 */
class WatermarkService
{
    /**
     * Process the uploaded image:
     *  1. Load into GD
     *  2. Render a semi-transparent bar at the bottom with date/time + lat/lng
     *  3. Save to public disk under gps_photos/
     *
     * @return string  Relative path stored on the public disk (e.g. gps_photos/abc123.jpg)
     */
    public function applyAndStore(
        UploadedFile $file,
        float $latitude,
        float $longitude,
        string $capturedAt
    ): string {
        // --- 1. Create GD image from upload ---
        $mime = $file->getMimeType();
        $source = match ($mime) {
            'image/png'  => imagecreatefrompng($file->getRealPath()),
            'image/webp' => imagecreatefromwebp($file->getRealPath()),
            default      => imagecreatefromjpeg($file->getRealPath()),
        };

        if (!$source) {
            throw new \RuntimeException('Unable to read uploaded image.');
        }

        $width  = imagesx($source);
        $height = imagesy($source);

        // --- 2. Calculate watermark bar dimensions ---
        $barHeight  = max(40, (int)($height * 0.07));     // 7 % of image height, min 40 px
        $fontSize   = max(12, (int)($barHeight * 0.35));  // ~35 % of bar height
        $padding    = (int)($barHeight * 0.25);
        $barY       = $height - $barHeight;

        // Semi-transparent black bar
        $overlay = imagecolorallocatealpha($source, 0, 0, 0, 60); // ~53 % opaque
        imagefilledrectangle($source, 0, $barY, $width, $height, $overlay);

        // White text colour
        $white = imagecolorallocate($source, 255, 255, 255);

        // --- 3. Build watermark lines ---
        $line1 = "📅  " . $capturedAt;
        $line2 = "📍  Lat: {$latitude}  |  Lng: {$longitude}";

        // Use a built-in GD font (1-5 scale; 4 is a clean medium size)
        $font = min(5, max(2, (int)($fontSize / 6)));

        $charWidth  = imagefontwidth($font);
        $charHeight = imagefontheight($font);

        // Position line 1 at top of bar, line 2 below it
        $y1 = $barY + (int)(($barHeight - 2 * $charHeight) / 3);
        $y2 = $y1 + $charHeight + 4;

        imagestring($source, $font, $padding, $y1, $line1, $white);
        imagestring($source, $font, $padding, $y2, $line2, $white);

        // --- 4. Save processed image ---
        $filename = 'gps_photos/' . Str::uuid() . '.jpg';
        $tmpPath  = sys_get_temp_dir() . '/' . Str::uuid() . '.jpg';

        imagejpeg($source, $tmpPath, 85); // 85 % quality
        imagedestroy($source);

        Storage::disk('public')->put($filename, file_get_contents($tmpPath));
        @unlink($tmpPath);

        return $filename;
    }
}
