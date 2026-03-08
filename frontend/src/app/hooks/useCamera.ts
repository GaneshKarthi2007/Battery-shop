import { useRef, useState, useCallback } from 'react';

interface UseCameraReturn {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    isStreaming: boolean;
    error: string | null;
    startCamera: () => Promise<void>;
    stopCamera: () => void;
    capturePhoto: () => Blob | null;
}

/**
 * Hook to access the device camera, render a live preview, and capture a still photo.
 * Prefers the rear (environment) camera on mobile devices.
 */
export function useCamera(): UseCameraReturn {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        setError(null);

        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Camera is not supported on this device / browser.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // rear camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setIsStreaming(true);
        } catch (err: any) {
            if (err.name === 'NotAllowedError') {
                setError('Camera permission denied. Please allow camera access in your browser settings.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera found on this device.');
            } else {
                setError(`Camera error: ${err.message}`);
            }
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsStreaming(false);
    }, []);

    /**
     * Capture the current video frame as a JPEG Blob.
     */
    const capturePhoto = useCallback((): Blob | null => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return null;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0);

        // Convert canvas content to a Blob synchronously via toDataURL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const byteString = atob(dataUrl.split(',')[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        }
        return new Blob([uint8Array], { type: 'image/jpeg' });
    }, []);

    return { videoRef, canvasRef, isStreaming, error, startCamera, stopCamera, capturePhoto };
}
