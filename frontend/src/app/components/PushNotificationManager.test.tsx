import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PushNotificationManager } from './PushNotificationManager';
import * as usePushHooks from '../hooks/usePushNotifications';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PushNotificationManager Component', () => {
  const mockSubscribe = vi.fn();
  const mockUnsubscribe = vi.fn();
  const mockSendTestNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unsupported message when Web Push is not available in browser', () => {
    vi.spyOn(usePushHooks, 'usePushNotifications').mockReturnValue({
      isSupported: false,
      permission: 'default',
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      sendTestNotification: mockSendTestNotification,
      refreshStatus: vi.fn(),
    });

    render(<PushNotificationManager />);

    expect(screen.getByText(/Push Notifications Unsupported/i)).toBeInTheDocument();
  });

  it('renders push notification card with Enable button when not subscribed', () => {
    vi.spyOn(usePushHooks, 'usePushNotifications').mockReturnValue({
      isSupported: true,
      permission: 'default',
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      sendTestNotification: mockSendTestNotification,
      refreshStatus: vi.fn(),
    });

    render(<PushNotificationManager />);

    expect(screen.getByText(/Push Notifications \(PWA\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Permission Needed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enable Real-Time Push/i })).toBeInTheDocument();
  });

  it('triggers subscribe when Enable button is clicked', async () => {
    mockSubscribe.mockResolvedValue(true);

    vi.spyOn(usePushHooks, 'usePushNotifications').mockReturnValue({
      isSupported: true,
      permission: 'granted',
      isSubscribed: false,
      isLoading: false,
      error: null,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      sendTestNotification: mockSendTestNotification,
      refreshStatus: vi.fn(),
    });

    render(<PushNotificationManager />);

    const enableBtn = screen.getByRole('button', { name: /Enable Real-Time Push/i });
    await userEvent.click(enableBtn);

    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('renders Disable and Send Test Push buttons when user is subscribed', async () => {
    mockSendTestNotification.mockResolvedValue({ message: 'Dispatched' });

    vi.spyOn(usePushHooks, 'usePushNotifications').mockReturnValue({
      isSupported: true,
      permission: 'granted',
      isSubscribed: true,
      isLoading: false,
      error: null,
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      sendTestNotification: mockSendTestNotification,
      refreshStatus: vi.fn(),
    });

    render(<PushNotificationManager />);

    expect(screen.getByText(/Subscribed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Test Push/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Disable Push/i })).toBeInTheDocument();

    const testBtn = screen.getByRole('button', { name: /Send Test Push/i });
    await userEvent.click(testBtn);

    expect(mockSendTestNotification).toHaveBeenCalled();
  });
});
