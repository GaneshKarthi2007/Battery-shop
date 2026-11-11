import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsApi } from './settingsApi';

describe('settingsApi', () => {
    beforeEach(() => {
        localStorage.setItem('auth_token', 'test-token');
    });

    it('fetches shop settings with the bearer token', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ service_log_id_prefix: 'SRV-', shop_name: 'SMR' }),
        }));

        const res = await settingsApi.getSettings();

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/settings'),
            expect.objectContaining({ method: 'GET' })
        );
        const headers = (fetch as any).mock.calls[0][1].headers as Headers;
        expect(headers.get('Authorization')).toBe('Bearer test-token');
        expect(res.service_log_id_prefix).toBe('SRV-');
    });

    it('sends a PUT with only the changed keys', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ service_log_id_prefix: 'JOB' }),
        }));

        await settingsApi.updateSettings({ service_log_id_prefix: 'JOB' });

        const [url, init] = (fetch as any).mock.calls[0];
        expect(url).toContain('/settings');
        expect(init.method).toBe('PUT');
        expect(JSON.parse(init.body)).toEqual({ service_log_id_prefix: 'JOB' });
    });

    it('throws the server message when the user is not allowed to update', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 403,
            json: async () => ({ message: 'Unauthorized. Only admins and developers can change settings.' }),
        }));

        await expect(settingsApi.updateSettings({ service_log_id_prefix: 'X' }))
            .rejects.toThrow(/Only admins and developers/);
    });
});
