import { apiClient } from './client';

/** Shop-wide settings as returned by GET/PUT /api/settings (snake_case keys). */
export interface ShopSettings {
    service_log_id_prefix: string | null;
    shop_name: string | null;
    shop_phone: string | null;
    shop_address: string | null;
    shop_gst: string | null;
    shop_email: string | null;
}

export type ShopSettingsUpdate = Partial<ShopSettings>;

export const settingsApi = {
    /** Any authenticated user may read. */
    getSettings: () => apiClient.get<ShopSettings>('/settings'),

    /** Admin and developer only; the server returns 403 for other roles. */
    updateSettings: (patch: ShopSettingsUpdate) => apiClient.put<ShopSettings>('/settings', patch),
};
