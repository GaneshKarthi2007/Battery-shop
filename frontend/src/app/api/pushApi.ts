import { apiClient } from './client';

export interface VapidKeyResponse {
  public_key: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  content_encoding?: string;
}

export interface PushSubscriptionResponse {
  message: string;
  subscription: {
    id: number;
    user_id: number;
    endpoint: string;
  };
}

export interface TestPushResponse {
  message: string;
  result: {
    success: number;
    failed: number;
  };
}

export const pushApi = {
  getVapidPublicKey: () =>
    apiClient.get<VapidKeyResponse>('/push-subscriptions/vapid-public-key'),

  subscribe: (subscription: PushSubscriptionPayload) =>
    apiClient.post<PushSubscriptionResponse>('/push-subscriptions', subscription),

  unsubscribe: (endpoint: string) =>
    apiClient.delete<{ message: string; deleted: boolean }>('/push-subscriptions', {
      body: JSON.stringify({ endpoint }),
      headers: { 'Content-Type': 'application/json' },
    }),

  sendTestNotification: () =>
    apiClient.post<TestPushResponse>('/push-subscriptions/test'),
};
