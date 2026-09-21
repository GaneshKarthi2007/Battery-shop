import React from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useDeveloper } from '../contexts/DeveloperContext';
import { Bell, BellOff, BellRing, Send, CheckCircle2, AlertTriangle, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface PushNotificationManagerProps {
  className?: string;
  showTitle?: boolean;
}

export const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({
  className = '',
  showTitle = true,
}) => {
  const { features } = useDeveloper();
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  // Developer Toggle Off -> Show "Coming Soon"
  if (features && !features.pushNotifications) {
    return (
      <div className={`p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 text-purple-950 dark:text-purple-200 ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Push Notifications</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-xs">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                Real-time Web Push notification system is currently under development. Stay tuned for future updates!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      const ok = await unsubscribe();
      if (ok) {
        toast.success('Push notifications disabled successfully');
      } else {
        toast.error('Failed to disable push notifications');
      }
    } else {
      const ok = await subscribe();
      if (ok) {
        toast.success('Real-time push notifications enabled!');
      } else {
        toast.error(error || 'Failed to enable push notifications');
      }
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      toast.success('Test push notification sent! Check your device notifications.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send test push notification');
    }
  };

  if (!isSupported) {
    return (
      <div className={`p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 ${className}`}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Push Notifications Unsupported</p>
            <p className="text-xs opacity-80">
              Web Push API or Service Workers are not supported in your browser. Try Chrome, Edge, Safari, or Firefox on HTTPS/localhost.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm space-y-4 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-lg ${isSubscribed ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {isSubscribed ? <BellRing className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Push Notifications (PWA)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receive instant job alerts and sales updates even when the app is closed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                permission === 'granted'
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                  : permission === 'denied'
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
              }`}
            >
              {permission === 'granted' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" /> Permission Granted
                </>
              ) : permission === 'denied' ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" /> Permission Denied
                </>
              ) : (
                'Permission Needed'
              )}
            </span>
          </div>
        </div>
      )}

      {permission === 'denied' && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Notification permission is blocked by your browser settings.
          </p>
          <p className="opacity-90">
            Please click the site settings icon in your browser address bar and set Notifications to "Allow", then refresh.
          </p>
        </div>
      )}

      {error && permission !== 'denied' && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <span className="text-xs font-semibold flex items-center gap-1">
            {isSubscribed ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Subscribed
              </span>
            ) : (
              <span className="text-muted-foreground">Not Subscribed</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSubscribed && (
            <button
              type="button"
              onClick={handleTestNotification}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send Test Push
            </button>
          )}

          <button
            type="button"
            onClick={handleToggle}
            disabled={isLoading || permission === 'denied'}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 ${
              isSubscribed
                ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
              </>
            ) : isSubscribed ? (
              <>
                <BellOff className="w-3.5 h-3.5" /> Disable Push
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" /> Enable Real-Time Push
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
