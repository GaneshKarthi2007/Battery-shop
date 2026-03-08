import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useCamera } from '../hooks/useCamera';
import { useGeolocation } from '../hooks/useGeolocation';
import { uploadGpsPhoto } from '../api/gpsPhotoApi';
import imageCompression from 'browser-image-compression';

/**
 * GpsCamera – Full-screen camera capture page.
 *
 * Flow:
 *  1. User opens page → camera + GPS are activated
 *  2. User taps "Capture" → frame is grabbed, GPS coords are locked
 *  3. Preview overlay shows the photo + coordinates
 *  4. User taps "Upload" → image is compressed and sent to API
 */
export function GpsCamera() {
    const navigate = useNavigate();
    const { videoRef, canvasRef, isStreaming, error: camError, startCamera, stopCamera, capturePhoto } = useCamera();
    const { latitude, longitude, accuracy, error: geoError, loading: geoLoading, refresh: refreshGps } = useGeolocation();

    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Start camera + GPS on mount
    useEffect(() => {
        startCamera();
        refreshGps();
        return () => stopCamera();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Revoke preview object URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleCapture = useCallback(() => {
        const blob = capturePhoto();
        if (!blob) return;
        setCapturedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
    }, [capturePhoto, stopCamera]);

    const handleRetake = useCallback(() => {
        setCapturedBlob(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setUploadError(null);
        startCamera();
        refreshGps();
    }, [previewUrl, startCamera, refreshGps]);

    const handleUpload = useCallback(async () => {
        if (!capturedBlob || latitude === null || longitude === null) return;

        setUploading(true);
        setUploadError(null);

        try {
            // Compress image before upload (target ≤ 1 MB)
            const compressedFile = await imageCompression(
                new File([capturedBlob], 'photo.jpg', { type: 'image/jpeg' }),
                { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }
            );

            await uploadGpsPhoto({
                image: compressedFile,
                latitude,
                longitude,
                capturedAt: new Date().toISOString(),
            });

            navigate('/gps-photos');
        } catch (err: any) {
            setUploadError(err.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    }, [capturedBlob, latitude, longitude, navigate]);

    const permissionError = camError || geoError;

    return (
        <div className="relative flex flex-col h-[calc(100vh-64px)] bg-black select-none">
            {/* ===== Hidden canvas for frame capture ===== */}
            <canvas ref={canvasRef} className="hidden" />

            {/* ===== Permission / Error banner ===== */}
            {permissionError && !capturedBlob && (
                <div className="absolute inset-x-0 top-0 z-30 bg-red-600/90 px-4 py-3 text-white text-sm text-center backdrop-blur-sm">
                    {permissionError}
                </div>
            )}

            {/* ===== Live Camera Viewfinder ===== */}
            {!capturedBlob && (
                <>
                    <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            autoPlay
                            playsInline
                            muted
                        />

                        {/* GPS indicator overlay */}
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md text-white text-xs rounded-full px-3 py-1.5">
                            {geoLoading ? (
                                <span className="animate-pulse">📡 Acquiring GPS…</span>
                            ) : latitude !== null ? (
                                <span>📍 {latitude.toFixed(5)}, {longitude?.toFixed(5)} (±{accuracy?.toFixed(0)}m)</span>
                            ) : (
                                <span className="text-yellow-300">⚠ No GPS</span>
                            )}
                        </div>
                    </div>

                    {/* Capture button bar */}
                    <div className="flex-shrink-0 flex justify-center items-center py-6 bg-gradient-to-t from-black/80 to-transparent">
                        <button
                            onClick={handleCapture}
                            disabled={!isStreaming || latitude === null}
                            className="w-18 h-18 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm 
                         transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed
                         hover:bg-white/30 focus:ring-4 focus:ring-white/40 focus:outline-none"
                            aria-label="Capture photo"
                        >
                            <div className="w-14 h-14 mx-auto rounded-full bg-white" />
                        </button>
                    </div>
                </>
            )}

            {/* ===== Preview + Upload ===== */}
            {capturedBlob && previewUrl && (
                <div className="flex-1 flex flex-col">
                    {/* Photo preview */}
                    <div className="relative flex-1 flex items-center justify-center bg-gray-900 overflow-hidden">
                        <img
                            src={previewUrl}
                            alt="Captured photo"
                            className="max-w-full max-h-full object-contain"
                        />

                        {/* Metadata overlay */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white space-y-1">
                            <p className="text-xs opacity-80">📅 {new Date().toLocaleString()}</p>
                            <p className="text-xs opacity-80">
                                📍 Lat: {latitude?.toFixed(6)} &nbsp;|&nbsp; Lng: {longitude?.toFixed(6)}
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex-shrink-0 flex gap-3 p-4 bg-gray-950">
                        <button
                            onClick={handleRetake}
                            disabled={uploading}
                            className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-semibold transition hover:bg-gray-600 disabled:opacity-40"
                        >
                            ↩ Retake
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold transition hover:bg-emerald-500 disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Uploading…
                                </>
                            ) : (
                                '☁ Upload'
                            )}
                        </button>
                    </div>

                    {uploadError && (
                        <div className="px-4 pb-4 bg-gray-950">
                            <p className="text-red-400 text-sm text-center">{uploadError}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
