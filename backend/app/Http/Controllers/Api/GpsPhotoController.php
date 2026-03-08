<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GpsPhoto;
use App\Services\WatermarkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GpsPhotoController extends Controller
{
    public function __construct(
        private readonly WatermarkService $watermark
    ) {}

    /**
     * GET /api/gps-photos
     * List GPS photos. Optionally filter by ?service_id=N.
     */
    public function index(Request $request): JsonResponse
    {
        $query = GpsPhoto::latest('captured_at');

        if ($request->filled('service_id')) {
            $query->where('service_id', $request->service_id);
        } else {
            $query->where('user_id', $request->user()->id);
        }

        return response()->json($query->get());
    }

    /**
     * POST /api/gps-photos
     * Upload a new GPS-tagged photo.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image'       => 'required|file|mimes:jpeg,jpg,png,webp|max:10240',
            'latitude'    => 'required|numeric|between:-90,90',
            'longitude'   => 'required|numeric|between:-180,180',
            'captured_at' => 'required|date',
            'service_id'  => 'nullable|integer|exists:services,id',
        ]);

        // Apply watermark and store image on public disk
        $imagePath = $this->watermark->applyAndStore(
            file:       $request->file('image'),
            latitude:   (float) $validated['latitude'],
            longitude:  (float) $validated['longitude'],
            capturedAt: $validated['captured_at'],
        );

        $photo = GpsPhoto::create([
            'user_id'     => $request->user()->id,
            'service_id'  => $validated['service_id'] ?? null,
            'image_path'  => $imagePath,
            'latitude'    => $validated['latitude'],
            'longitude'   => $validated['longitude'],
            'captured_at' => $validated['captured_at'],
        ]);

        return response()->json($photo, 201);
    }

    /**
     * GET /api/gps-photos/{gpsPhoto}
     * Return a single GPS photo record.
     */
    public function show(GpsPhoto $gpsPhoto, Request $request): JsonResponse
    {
        // Ensure the authenticated user owns this photo
        if ($gpsPhoto->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($gpsPhoto);
    }

    /**
     * DELETE /api/gps-photos/{gpsPhoto}
     * Delete a GPS photo and its file from storage.
     */
    public function destroy(GpsPhoto $gpsPhoto, Request $request): JsonResponse
    {
        if ($gpsPhoto->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Remove image file from disk
        Storage::disk('public')->delete($gpsPhoto->image_path);

        $gpsPhoto->delete();

        return response()->json(null, 204);
    }
}
