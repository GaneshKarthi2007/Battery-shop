import { useState, useCallback } from 'react';

interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    error: string | null;
    loading: boolean;
}

interface UseGeolocationReturn extends GeolocationState {
    refresh: () => void;
}

/**
 * Hook that retrieves the device's GPS coordinates via the Geolocation API.
 * Uses high-accuracy mode for the best available position fix.
 */
export function useGeolocation(): UseGeolocationReturn {
    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: null,
        loading: false,
    });

    const refresh = useCallback(() => {
        if (!navigator.geolocation) {
            setState((prev) => ({
                ...prev,
                error: 'Geolocation is not supported by this browser.',
                loading: false,
            }));
            return;
        }

        setState((prev) => ({ ...prev, loading: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    error: null,
                    loading: false,
                });
            },
            (err) => {
                let message: string;
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        message = 'Location permission denied. Please enable location access in your browser settings.';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        message = 'Location information is unavailable on this device.';
                        break;
                    case err.TIMEOUT:
                        message = 'Location request timed out. Please try again.';
                        break;
                    default:
                        message = `Geolocation error: ${err.message}`;
                }
                setState((prev) => ({ ...prev, error: message, loading: false }));
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0, // No caching – always fresh position
            }
        );
    }, []);

    return { ...state, refresh };
}
