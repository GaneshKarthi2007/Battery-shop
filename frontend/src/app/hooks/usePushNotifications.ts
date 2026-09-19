import { useState, useEffect, useCallback } from 'react';
import { pushApi } from '../api/pushApi';
import { registerServiceWorker } from '../pwa/registerServiceWorker';

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (!supported) {
      setIsLoading(false);
      return;
    }

    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } else {
        setIsSubscribed(false);
      }
    } catch (err: any) {
      console.error('Error checking push subscription status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const subscribe = async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Request Permission
      let currentPermission = Notification.permission;
      if (currentPermission === 'default') {
        currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);
      }

      if (currentPermission !== 'granted') {
        throw new Error('Notification permission was denied.');
      }

      // 2. Ensure Service Worker Registration
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = (await registerServiceWorker()) || undefined;
      }

      if (!registration) {
        throw new Error('Failed to register Service Worker.');
      }

      // 3. Fetch VAPID Public Key from backend
      const { public_key } = await pushApi.getVapidPublicKey();
      if (!public_key) {
        throw new Error('VAPID public key not received from backend.');
      }

      const applicationServerKey = urlBase64ToUint8Array(public_key);

      // 4. Subscribe with PushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });

      // Extract keys
      const p256dhBuffer = subscription.getKey('p256dh');
      const authBuffer = subscription.getKey('auth');

      const p256dh = arrayBufferToBase64Url(p256dhBuffer);
      const auth = arrayBufferToBase64Url(authBuffer);

      // 5. Send subscription details to backend
      await pushApi.subscribe({
        endpoint: subscription.endpoint,
        keys: {
          p256dh,
          auth,
        },
        content_encoding: 'aes128gcm',
      });

      setIsSubscribed(true);
      return true;
    } catch (err: any) {
      const msg = err.message || 'Failed to subscribe to push notifications.';
      setError(msg);
      console.error('Subscribe push notification error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return false;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();
          await pushApi.unsubscribe(endpoint);
        }
      }
      setIsSubscribed(false);
      return true;
    } catch (err: any) {
      const msg = err.message || 'Failed to unsubscribe from push notifications.';
      setError(msg);
      console.error('Unsubscribe push notification error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await pushApi.sendTestNotification();
      return res;
    } catch (err: any) {
      const msg = err.message || 'Failed to send test push notification.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
    refreshStatus: checkStatus,
  };
}
