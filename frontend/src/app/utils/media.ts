/**
 * Formats a storage media asset path (photos, audio files, etc.) into a clean,
 * fully-qualified URL for browser fetching/playback.
 */
export function getMediaUrl(path?: string | null): string {
    if (!path) return '';

    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
        return path;
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const origin = apiBase.replace(/\/api\/?$/, '');

    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    if (cleanPath.startsWith('/storage/')) {
        return `${origin}${cleanPath}`;
    }

    return `${origin}/storage${cleanPath}`;
}
