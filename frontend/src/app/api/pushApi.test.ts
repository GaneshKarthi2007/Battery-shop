import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pushApi } from './pushApi';

describe('pushApi', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ public_key: 'MOCK_PUBLIC_KEY' }),
      })
    );
    localStorage.setItem('auth_token', 'test-token');
  });

  it('fetches VAPID public key', async () => {
    const res = await pushApi.getVapidPublicKey();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/push-subscriptions/vapid-public-key'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(res).toEqual({ public_key: 'MOCK_PUBLIC_KEY' });
  });

  it('posts push subscription payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ message: 'Push subscription saved successfully' }),
      })
    );

    const payload = {
      endpoint: 'https://push.example.com/send/123',
      keys: { p256dh: 'key_p256', auth: 'key_auth' },
    };

    const res = await pushApi.subscribe(payload);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/push-subscriptions'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
    expect(res).toEqual({ message: 'Push subscription saved successfully' });
  });

  it('deletes push subscription by endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Removed', deleted: true }),
      })
    );

    const endpoint = 'https://push.example.com/send/123';
    const res = await pushApi.unsubscribe(endpoint);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/push-subscriptions'),
      expect.objectContaining({
        method: 'DELETE',
        body: JSON.stringify({ endpoint }),
      })
    );
    expect(res).toEqual({ message: 'Removed', deleted: true });
  });

  it('triggers test push notification endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Dispatched', result: { success: 1, failed: 0 } }),
      })
    );

    const res = await pushApi.sendTestNotification();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/push-subscriptions/test'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(res).toEqual({ message: 'Dispatched', result: { success: 1, failed: 0 } });
  });
});
