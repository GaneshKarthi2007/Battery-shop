import { apiClient } from './client';

/** Shape of a GPS photo record from the API */
export interface GpsPhotoRecord {
    id: number;
    user_id: number;
    image_path: string;
    image_url: string;
    latitude: number;
    longitude: number;
    captured_at: string;
    created_at: string;
    updated_at: string;
}

/**
 * Upload a GPS-tagged photo.
 * Sends image + coordinates as multipart/form-data.
 */
export async function uploadGpsPhoto(data: {
    image: Blob;
    latitude: number;
    longitude: number;
    capturedAt: string;
    serviceId?: number;
}): Promise<GpsPhotoRecord> {
    const formData = new FormData();
    formData.append('image', data.image, 'gps_photo.jpg');
    formData.append('latitude', String(data.latitude));
    formData.append('longitude', String(data.longitude));
    formData.append('captured_at', data.capturedAt);
    if (data.serviceId) {
        formData.append('service_id', String(data.serviceId));
    }

    return apiClient.post<GpsPhotoRecord>('/gps-photos', formData);
}

/**
 * Fetch GPS photos. Optionally filter by serviceId.
 */
export async function fetchGpsPhotos(serviceId?: number): Promise<GpsPhotoRecord[]> {
    const params = serviceId ? { service_id: String(serviceId) } : undefined;
    return apiClient.get<GpsPhotoRecord[]>('/gps-photos', { params });
}

/**
 * Delete a GPS photo by ID.
 */
export async function deleteGpsPhoto(id: number): Promise<void> {
    return apiClient.delete<void>(`/gps-photos/${id}`);
}
