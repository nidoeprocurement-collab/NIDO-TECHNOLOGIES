import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  loadNotificationsFromSupabase,
  markNotificationReadInSupabase,
  type DbNotificationRow,
} from '@/lib/notificationsApi';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<DbNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await loadNotificationsFromSupabase(50);
      setNotifications(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationReadInSupabase(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)),
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">Order, approval, procurement, and finance alerts</p>
        </div>
        <Button variant="outline" disabled={loading} onClick={() => void load()}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100">
        {loading && notifications.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">Loading notifications…</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
            <Bell className="h-8 w-8 text-gray-300" />
            <span>No notifications yet.</span>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`p-4 flex items-start justify-between gap-4 ${n.is_read ? 'opacity-70' : 'bg-blue-50/30'}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{n.title}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">{n.module}</span>
                </div>
                {n.description && <p className="mt-1 text-xs text-gray-600">{n.description}</p>}
                <p className="mt-1 text-[11px] text-gray-400">{new Date(n.created_at).toLocaleString('en-IN')}</p>
              </div>
              {!n.is_read && (
                <Button variant="ghost" size="sm" onClick={() => void handleMarkRead(n.id)}>
                  <CheckCircle2 className="mr-1 h-4 w-4 text-emerald-600" /> Mark Read
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
