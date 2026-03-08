import { useState, useEffect, useCallback } from 'react';
import { Camera, X, MapPin, Trash2, Upload, RotateCcw } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useGeolocation } from '../hooks/useGeolocation';
import { uploadGpsPhoto, fetchGpsPhotos, deleteGpsPhoto, type GpsPhotoRecord } from '../api/gpsPhotoApi';
import imageCompression from 'browser-image-compression';
import { Button } from './Button';

interface ServiceGpsCameraProps {
    serviceId: number;
}

/**
 * Inline GPS Camera component for the Service Details page.
 * Lets staff capture GPS-tagged photos tied to a specific service,
 * and displays previously captured photos in a mini gallery.
 */
export function ServiceGpsCamera({ serviceId }: ServiceGpsCameraProps) {
    // Camera state
    const { videoRef, canvasRef, isStreaming, error: camError, startCamera, stopCamera, capturePhoto } = useCamera();
    const { latitude, longitude, accuracy, error: geoError, loading: geoLoading, refresh: refreshGps } = useGeolocation();

    const [showCamera, setShowCamera] = useState(false);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Gallery state
    const [photos, setPhotos] = useState<GpsPhotoRecord[]>([]);
    const [loadingPhotos, setLoadingPhotos] = useState(true);
    const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

    // Load existing photos for this service
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await fetchGpsPhotos(serviceId);
                if (!cancelled) setPhotos(data);
            } catch {
                // Silently fail – gallery is supplementary
            } finally {
                if (!cancelled) setLoadingPhotos(false);
            }
        })();
        return () => { cancelled = true; };
    }, [serviceId]);

    // Cleanup preview URL
    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    const openCamera = useCallback(() => {
        setShowCamera(true);
        startCamera();
        refreshGps();
    }, [startCamera, refreshGps]);

    const closeCamera = useCallback(() => {
        stopCamera();
        setCapturedBlob(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setUploadError(null);
        setShowCamera(false);
    }, [stopCamera, previewUrl]);

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
            const compressedFile = await imageCompression(
                new File([capturedBlob], 'photo.jpg', { type: 'image/jpeg' }),
                { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true }
            );

            const newPhoto = await uploadGpsPhoto({
                image: compressedFile,
                latitude,
                longitude,
                capturedAt: new Date().toISOString(),
                serviceId,
            });

            setPhotos((prev) => [newPhoto, ...prev]);
            closeCamera();
        } catch (err: any) {
            setUploadError(err.message || 'Upload failed.');
        } finally {
            setUploading(false);
        }
    }, [capturedBlob, latitude, longitude, serviceId, closeCamera]);

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this photo?')) return;
        try {
            await deleteGpsPhoto(id);
            setPhotos((prev) => prev.filter((p) => p.id !== id));
        } catch (err: any) {
            alert(err.message || 'Failed to delete.');
        }
    };

    const permissionError = camError || geoError;

    return (
        <div className="space-y-4">
            {/* ===== Capture Button ===== */}
            {!showCamera && (
                <Button
                    onClick={openCamera}
                    className="w-full flex items-center justify-center gap-2 py-4 border-dashed border-2 border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100/50 rounded-xl font-bold"
                    variant="outline"
                >
                    <Camera className="w-5 h-5" />
                    Capture GPS Photo
                </Button>
            )}

            {/* ===== Inline Camera / Preview ===== */}
            {showCamera && (
                <div className="rounded-2xl overflow-hidden border-2 border-blue-200 bg-black relative">
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Close button */}
                    <button
                        onClick={closeCamera}
                        className="absolute top-2 right-2 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Permission error */}
                    {permissionError && !capturedBlob && (
                        <div className="absolute inset-x-0 top-0 z-20 bg-red-600/90 px-3 py-2 text-white text-xs text-center">
                            {permissionError}
                        </div>
                    )}

                    {/* Live viewfinder */}
                    {!capturedBlob && (
                        <>
                            <div className="relative aspect-[4/3] flex items-center justify-center overflow-hidden">
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                                {/* GPS badge */}
                                <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur text-white text-[10px] rounded-full px-2.5 py-1">
                                    {geoLoading ? (
                                        <span className="animate-pulse">📡 Acquiring…</span>
                                    ) : latitude !== null ? (
                                        <span>📍 {latitude.toFixed(4)}, {longitude?.toFixed(4)} ±{accuracy?.toFixed(0)}m</span>
                                    ) : (
                                        <span className="text-yellow-300">⚠ No GPS</span>
                                    )}
                                </div>
                            </div>

                            {/* Capture controls */}
                            <div className="flex justify-center py-3 bg-gray-900">
                                <button
                                    onClick={handleCapture}
                                    disabled={!isStreaming || latitude === null}
                                    className="w-14 h-14 rounded-full border-[3px] border-white bg-white/20 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/30"
                                    aria-label="Capture"
                                >
                                    <div className="w-10 h-10 mx-auto rounded-full bg-white" />
                                </button>
                            </div>
                        </>
                    )}

                    {/* Preview after capture */}
                    {capturedBlob && previewUrl && (
                        <>
                            <div className="relative aspect-[4/3]">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                                    <p className="text-[10px] opacity-80">📅 {new Date().toLocaleString()}</p>
                                    <p className="text-[10px] opacity-80">📍 {latitude?.toFixed(5)}, {longitude?.toFixed(5)}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 p-3 bg-gray-900">
                                <button
                                    onClick={handleRetake}
                                    disabled={uploading}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gray-700 text-white text-sm font-semibold hover:bg-gray-600 disabled:opacity-40"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Retake
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-60"
                                >
                                    {uploading ? (
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Upload className="w-3.5 h-3.5" />
                                    )}
                                    {uploading ? 'Uploading…' : 'Upload'}
                                </button>
                            </div>

                            {uploadError && (
                                <p className="px-3 pb-2 bg-gray-900 text-red-400 text-xs text-center">{uploadError}</p>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ===== Photo Gallery ===== */}
            {loadingPhotos ? (
                <div className="flex justify-center py-4">
                    <span className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
            ) : photos.length > 0 ? (
                <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        GPS Photos ({photos.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                            >
                                <img
                                    src={photo.image_url}
                                    alt={`GPS Photo ${photo.id}`}
                                    className="w-full aspect-[4/3] object-cover cursor-pointer hover:opacity-90 transition"
                                    onClick={() => setExpandedPhoto(photo.image_url)}
                                    loading="lazy"
                                />
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                                    <p className="text-[9px] text-white/80 truncate">
                                        📍 {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(photo.id)}
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition w-6 h-6 flex items-center justify-center rounded-full bg-red-600/80 text-white hover:bg-red-500"
                                    aria-label="Delete"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* ===== Expanded photo lightbox ===== */}
            {expandedPhoto && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setExpandedPhoto(null)}
                >
                    <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <img src={expandedPhoto} alt="Expanded" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
                        <button
                            onClick={() => setExpandedPhoto(null)}
                            className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-900 shadow-lg hover:bg-gray-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
