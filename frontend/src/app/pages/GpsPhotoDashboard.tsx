import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { fetchGpsPhotos, deleteGpsPhoto, type GpsPhotoRecord } from '../api/gpsPhotoApi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon paths (broken by bundlers)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

/* eslint-disable @typescript-eslint/no-explicit-any */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

/**
 * GpsPhotoDashboard – Map + gallery view of all GPS-tagged photos.
 *
 * Top half: Leaflet map with markers at each photo's coordinates.
 * Bottom half: Scrollable grid of thumbnails with delete option.
 */
export function GpsPhotoDashboard() {
    const navigate = useNavigate();
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup>(L.layerGroup());

    const [photos, setPhotos] = useState<GpsPhotoRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // ─── Fetch photos ───
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await fetchGpsPhotos();
                if (!cancelled) setPhotos(data);
            } catch (err: any) {
                if (!cancelled) setError(err.message || 'Failed to load photos.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // ─── Initialise map ───
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [11.0168, 76.9558], // Default: Coimbatore, India
            zoom: 12,
            zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        markersRef.current.addTo(map);
        mapRef.current = map;

        // Cleanup on unmount
        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // ─── Update markers when photos change ───
    useEffect(() => {
        const group = markersRef.current;
        group.clearLayers();

        if (photos.length === 0 || !mapRef.current) return;

        const bounds: L.LatLngExpression[] = [];

        photos.forEach((photo) => {
            const latLng: L.LatLngExpression = [photo.latitude, photo.longitude];
            bounds.push(latLng);

            const marker = L.marker(latLng);
            const popupHtml = `
        <div style="text-align:center;min-width:160px">
          <img src="${photo.image_url}" alt="GPS Photo"
               style="width:150px;height:100px;object-fit:cover;border-radius:6px;margin-bottom:6px" />
          <p style="margin:0;font-size:11px;color:#555">
            📅 ${new Date(photo.captured_at).toLocaleString()}<br/>
            📍 ${photo.latitude.toFixed(5)}, ${photo.longitude.toFixed(5)}
          </p>
        </div>
      `;
            marker.bindPopup(popupHtml, { maxWidth: 200 });
            group.addLayer(marker);
        });

        if (bounds.length > 0) {
            mapRef.current.fitBounds(L.latLngBounds(bounds as L.LatLngTuple[]), { padding: [40, 40], maxZoom: 15 });
        }
    }, [photos]);

    // ─── Delete handler ───
    const handleDelete = async (id: number) => {
        if (!confirm('Delete this photo permanently?')) return;
        setDeletingId(id);
        try {
            await deleteGpsPhoto(id);
            setPhotos((prev) => prev.filter((p) => p.id !== id));
        } catch (err: any) {
            alert(err.message || 'Failed to delete photo.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-950 text-white">
            {/* ===== Header ===== */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
                <h1 className="text-lg font-bold tracking-tight">📸 GPS Photo Dashboard</h1>
                <button
                    onClick={() => navigate('/gps-camera')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-sm font-semibold 
                     transition hover:bg-emerald-500 active:scale-95"
                >
                    📷 Capture New
                </button>
            </div>

            {/* ===== Map ===== */}
            <div className="flex-shrink-0 h-[45vh] min-h-[250px] relative">
                <div ref={mapContainerRef} className="absolute inset-0 z-0" />
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
                        <span className="w-8 h-8 border-3 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* ===== Gallery ===== */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm text-center">
                        {error}
                    </div>
                )}

                {!loading && photos.length === 0 && !error && (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 space-y-3">
                        <span className="text-5xl">🗺️</span>
                        <p className="text-sm">No GPS photos yet. Tap <strong>Capture New</strong> to get started.</p>
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {photos.map((photo) => (
                        <div
                            key={photo.id}
                            className="group relative rounded-xl overflow-hidden bg-gray-800 border border-gray-700/50 transition hover:border-emerald-500/50"
                        >
                            <img
                                src={photo.image_url}
                                alt={`GPS Photo ${photo.id}`}
                                className="w-full aspect-[4/3] object-cover"
                                loading="lazy"
                            />

                            {/* Metadata overlay */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 space-y-0.5">
                                <p className="text-[10px] text-gray-300 truncate">
                                    📅 {new Date(photo.captured_at).toLocaleDateString()}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">
                                    📍 {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
                                </p>
                            </div>

                            {/* Delete button */}
                            <button
                                onClick={() => handleDelete(photo.id)}
                                disabled={deletingId === photo.id}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity 
                           w-7 h-7 flex items-center justify-center rounded-full bg-red-600/80 backdrop-blur-sm 
                           text-white text-xs hover:bg-red-500 disabled:opacity-40"
                                aria-label="Delete photo"
                            >
                                {deletingId === photo.id ? '…' : '✕'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
