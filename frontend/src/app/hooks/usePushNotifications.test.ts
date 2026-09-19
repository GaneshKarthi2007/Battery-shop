import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePushNotifications, urlBase64ToUint8Array } from './usePushNotifications';
import { pushApi } from '../api/pushApi';

vi.mock('../api/pushApi', () => ({
  pushApi: {
    getVapidPublicKey: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    sendTestNotification: vi.fn(),
  },
}));

describe('usePushNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('converts base64url string to Uint8Array', () => {
    const base64 = 'BGUFTm1WirCawVhI9Er6mZknt9lgw0PimNwN52twDQ1FB8Y6FRIze9aCPwU_njrU9z6ODlEMP7O6CBdGIc8M72s';
    const result = urlBase64ToUint8Array(base64);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('detects when push API is not supported in browser environment', async () => {
    const originalNotification = window.Notification;
    // @ts-ignore
    delete window.Notification;

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSupported).toBe(false);

    window.Notification = originalNotification;
  });

  it('initializes hook state when Push API is available', async () => {
    const mockSubscription = {
      endpoint: 'https://push.example.com/sub',
      unsubscribe: vi.fn().mockResolvedValue(true),
    };

    const mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(mockSubscription),
    };

    const mockRegistration = {
      pushManager: mockPushManager,
    };

    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: vi.fn().mockResolvedValue(mockRegistration),
      },
    });

    vi.stubGlobal('Notification', {
      permission: 'granted',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    });

    vi.stubGlobal('PushManager', {});

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSupported).toBe(true);
    expect(result.current.permission).toBe('granted');
    expect(result.current.isSubscribed).toBe(true);
  });

  it('unsubscribes push notification successfully', async () => {
    const mockUnsubscribe = vi.fn().mockResolvedValue(true);
    const mockSubscription = {
      endpoint: 'https://push.example.com/sub-to-remove',
      unsubscribe: mockUnsubscribe,
    };

    const mockPushManager = {
      getSubscription: vi.fn().mockResolvedValue(mockSubscription),
    };

    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: vi.fn().mockResolvedValue({ pushManager: mockPushManager }),
      },
    });

    vi.stubGlobal('Notification', { permission: 'granted' });
    vi.stubGlobal('PushManager', {});

    (pushApi.unsubscribe as any).mockResolvedValue({ message: 'Removed', deleted: true });

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true);
    });

    let success = false;
    await act(async () => {
      success = await result.current.unsubscribe();
    });

    expect(success).toBe(true);
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(pushApi.unsubscribe).toHaveBeenCalledWith('https://push.example.com/sub-to-remove');
    expect(result.current.isSubscribed).toBe(false);
  });
});
