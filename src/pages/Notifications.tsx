import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { fetchNotifications, markAsRead, markAllAsRead, Notification } from '@/lib/api/notifications';

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading notifications...</div>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-sky-500" /> Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400">View alerts and system notifications.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition">
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">You're all caught up!</p>
            <p className="text-sm mt-1">No new notifications to display.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50 dark:divide-slate-700">
             {notifications.map((n) => (
                <div key={n.id} className={`p-4 flex justify-between items-start ${n.is_read ? 'opacity-60' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                   <div>
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                         {!n.is_read && <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>}
                         {n.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                   </div>
                   {!n.is_read && (
                      <button onClick={() => handleMarkAsRead(n.id)} className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline">
                        Mark read
                      </button>
                   )}
                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
