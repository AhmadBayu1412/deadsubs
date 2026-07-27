// Phase 13 — Notification Dropdown
// Dropdown panel for displaying and managing notifications.
import { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCheck,
  X,
  AlertTriangle,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useNotificationStore } from '../viewmodels/notificationStore';
import type { AppNotification, NotificationType } from '../types/notification';

const TYPE_META: Record<NotificationType, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  renewal_today: { icon: Bell, color: 'text-accent-blue' },
  renewal_tomorrow: { icon: Bell, color: 'text-accent-blue' },
  payment_overdue: { icon: AlertTriangle, color: 'text-accent-red' },
  subscription_added: { icon: CheckCircle2, color: 'text-green-500' },
  subscription_cancelled: { icon: Trash2, color: 'text-accent-red' },
  subscription_cancelled_auto: { icon: Trash2, color: 'text-accent-red' },
};

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = TYPE_META[notification.type];
  const Icon = meta.icon;

  return (
    <div
      className={clsx(
        'flex items-start gap-3 px-4 py-3 border-b border-border last:border-0',
        'hover:bg-bg transition-colors',
        !notification.read && 'bg-accent-blue/5',
      )}
    >
      <div className={clsx('mt-0.5 flex-shrink-0', meta.color)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-primary truncate">{notification.title}</p>
          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-accent-blue flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-secondary mt-0.5 leading-relaxed">
          {notification.body}
        </p>
        <p className="text-xs text-secondary/60 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {!notification.read && (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="p-1 text-secondary hover:text-accent-blue transition-colors cursor-pointer"
            aria-label="Mark as read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="p-1 text-secondary hover:text-accent-red transition-colors cursor-pointer"
          aria-label="Delete notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function NotificationDropdown() {
  const dropdownOpen = useNotificationStore((s) => s.dropdownOpen);
  const openDropdown = useNotificationStore((s) => s.openDropdown);
  const closeDropdown = useNotificationStore((s) => s.closeDropdown);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeDropdown();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, closeDropdown]);

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={dropdownOpen ? closeDropdown : openDropdown}
        className={clsx(
          'relative p-2 rounded-lg transition-colors duration-150 cursor-pointer',
          dropdownOpen
            ? 'bg-accent-blue/10 text-accent-blue'
            : 'text-secondary hover:bg-border/50 hover:text-primary',
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-red text-white text-[10px] font-bold flex items-center justify-center leading-none"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {dropdownOpen && (
        <div
          className={clsx(
            'absolute right-0 top-full mt-2 w-80 rounded-xl',
            'bg-surface border border-border shadow-xl z-50',
            'overflow-hidden',
          )}
          role="menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-secondary" />
              <span className="text-sm font-semibold text-primary">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-accent-blue hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Bell className="w-8 h-8 text-secondary/40 mb-2" />
                <p className="text-sm text-secondary">No notifications yet</p>
                <p className="text-xs text-secondary/60 mt-1">
                  We&apos;ll notify you about upcoming renewals and account changes.
                </p>
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={markRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 20 && (
            <div className="px-4 py-2 border-t border-border text-center">
              <p className="text-xs text-secondary">
                Showing 20 of {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
