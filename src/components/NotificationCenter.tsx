/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Bell, Check, X, Info, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NotificationItem, AppLanguage } from '../types';
import { TRANSLATIONS } from '../i18n';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  lang: AppLanguage;
}

export default function NotificationCenter({
  notifications,
  onMarkAsRead,
  onClearAll,
  lang,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const resp = await Notification.requestPermission();
      setPermission(resp);
      if (resp === 'granted') {
        new Notification("MCA Compliance tracker - Soumya Ranjan", {
          body: "Notifications are successfully enabled! You will receive timely alerts for pending corporate filing milestones.",
          icon: "/favicon.ico",
        });
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
      case 'warn':
        return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
      case 'error':
        return <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        id="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-neutral-800 transition-colors"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 transform translate-x-1/2 -translate-y-1/2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] font-bold text-white items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Slide-out Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            {/* Notification Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-white dark:bg-neutral-900 border-l border-gray-200 dark:border-neutral-800 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gray-50/50 dark:bg-neutral-900/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Desktop Permission Prompt */}
              {permission === 'default' && (
                <div className="p-3 bg-amber-50 border-b border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 flex flex-col gap-2 items-start">
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    Receive system alerts for upcoming corporate filings on your device.
                  </p>
                  <button
                    onClick={requestNotificationPermission}
                    className="text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 dark:bg-amber-800/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 px-3 py-1.5 rounded-md self-stretch text-center transition-colors"
                  >
                    Enable Desktop Notifications
                  </button>
                </div>
              )}

              {/* Notification List Body */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {notifications.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                    <CheckCircle2 className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {t.labelAllClear || "All clear!"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      No compliance warnings found.
                    </p>
                  </div>
                ) : (
                  notifications.map(item => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border flex gap-3 relative transition-all ${
                        item.read
                          ? 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800/50 opacity-70'
                          : 'bg-amber-50/10 border-amber-100/35 dark:bg-neutral-800/40 dark:border-neutral-800 shadow-xs'
                      }`}
                    >
                      {getTypeIcon(item.type)}
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white leading-snug">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 leading-normal break-words">
                          {item.message}
                        </p>
                        <span className="text-[9px] text-gray-400 font-mono mt-1.5 block">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {!item.read && (
                        <button
                          onClick={() => onMarkAsRead(item.id)}
                          title="Mark as Read"
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-emerald-500 rounded-md hover:bg-emerald-50/50 dark:hover:bg-neutral-800"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-100 dark:border-neutral-800 flex justify-between bg-gray-50/50 dark:bg-neutral-900/50">
                  <button
                    onClick={onClearAll}
                    className="text-xs font-bold text-gray-500 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400 transition-colors w-full text-center"
                  >
                    Clear All Alerts
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Global hook/trigger simulation for browser system messages
export function sendSystemNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch (e) {
      console.warn("Native Notification failed (sandbox iframe constraint):", e);
    }
  }
}
