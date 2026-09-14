import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const DAILY_REMINDER_ID = 2100;
const TEST_REMINDER_ID = 9999;

/**
 * Check if running natively inside Capacitor Android/iOS shell
 */
export const isNative = () => Capacitor.isNativePlatform();

/**
 * Request notification permissions across both Native and Web environments
 */
export async function requestNotificationPermission() {
  if (isNative()) {
    try {
      const check = await LocalNotifications.checkPermissions();
      if (check.display === 'granted') {
        return 'granted';
      }
      const req = await LocalNotifications.requestPermissions();
      return req.display;
    } catch (err) {
      console.error('Failed to request native notification permissions:', err);
      return 'denied';
    }
  }

  // Web Browser environment
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      return await Notification.requestPermission();
    } catch (err) {
      console.error('Failed to request web notification permissions:', err);
      return 'denied';
    }
  }

  return 'denied';
}

/**
 * Schedules or cancels the daily reminder notification
 * @param {string} timeStr - "HH:MM" 24-hr format (e.g., "21:00")
 * @param {boolean} enabled - Whether daily reminder is enabled
 */
export async function syncDailyReminder(timeStr = '21:00', enabled = true) {
  if (!isNative()) {
    return;
  }

  try {
    // Cancel any existing daily reminder first
    const pending = await LocalNotifications.getPending();
    const existing = pending.notifications.find((n) => n.id === DAILY_REMINDER_ID);
    if (existing) {
      await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
    }

    if (!enabled) {
      return;
    }

    // Ensure permissions
    const permStatus = await requestNotificationPermission();
    if (permStatus !== 'granted') {
      console.warn('Cannot schedule reminder: Notification permission not granted');
      return;
    }

    const [hourStr, minuteStr] = (timeStr || '21:00').split(':');
    const hour = parseInt(hourStr, 10) || 21;
    const minute = parseInt(minuteStr, 10) || 0;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: DAILY_REMINDER_ID,
          title: 'Expenso Daily Reminder',
          body: 'Time to record your daily personal expenses and shared bills!',
          schedule: {
            on: {
              hour,
              minute
            },
            allowWhileIdle: true
          },
          smallIcon: 'ic_stat_expenso',
          iconColor: '#6366F1'
        }
      ]
    });
  } catch (err) {
    console.error('Error syncing native daily reminder:', err);
  }
}

/**
 * Triggers an immediate test notification for user verification
 */
export async function sendTestNotification() {
  if (isNative()) {
    try {
      const perm = await requestNotificationPermission();
      if (perm !== 'granted') {
        alert('Notification permission was not granted. Please enable notifications in Android Settings for Expenso.');
        return { success: false, reason: 'permission_denied' };
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: TEST_REMINDER_ID,
            title: 'Expenso Reminder Test',
            body: 'Daily reminders are active! Expenso will remind you to track expenses at your scheduled time.',
            schedule: {
              at: new Date(Date.now() + 1000)
            },
            smallIcon: 'ic_stat_expenso',
            iconColor: '#6366F1'
          }
        ]
      });

      return { success: true, native: true };
    } catch (err) {
      console.error('Native test notification error:', err);
      alert(`Could not send Android notification: ${err.message}`);
      return { success: false, error: err };
    }
  }

  // Web fallback
  if (!('Notification' in window)) {
    alert('This browser does not support desktop notifications.');
    return { success: false, reason: 'unsupported' };
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    new Notification('Expenso 9:00 PM Reminder', {
      body: 'Time to record your daily personal expenses and shared bills!',
      icon: '/app-icon.png'
    });
    return { success: true, native: false };
  } else {
    alert('Notification permission was denied. Please allow notifications in browser settings.');
    return { success: false, reason: 'permission_denied' };
  }
}

/**
 * Sends a native / web notification after an archive file (PDF or TXT) is downloaded
 */
export async function sendDownloadCompleteNotification(filename = 'Expenso_Annual_Archive.pdf', year = '') {
  const notifId = Math.floor(10000 + Math.random() * 89999);
  const title = 'PDF Archive Ready';
  const body = `Your ${year ? `${year} ` : ''}annual expense archive (${filename}) has been downloaded successfully!`;

  if (isNative()) {
    try {
      const perm = await requestNotificationPermission();
      if (perm === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title,
              body,
              schedule: {
                at: new Date(Date.now() + 500)
              },
              smallIcon: 'ic_stat_expenso',
              iconColor: '#6366F1'
            }
          ]
        });
        return true;
      }
    } catch (err) {
      console.warn('Native download notification error:', err);
    }
    return false;
  }

  // Web Browser Notification Fallback
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/app-icon.png'
      });
      return true;
    } catch (err) {
      console.warn('Web download notification error:', err);
    }
  }

  return false;
}

/**
 * Sends a native / web notification after JSON backup export is created
 */
export async function sendBackupCompleteNotification(filename = 'Expenso_Backup.json') {
  const notifId = Math.floor(20000 + Math.random() * 79999);
  const title = 'Backup Export Successful';
  const body = `Your vault backup (${filename}) has been exported successfully.`;

  if (isNative()) {
    try {
      const perm = await requestNotificationPermission();
      if (perm === 'granted') {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title,
              body,
              schedule: {
                at: new Date(Date.now() + 500)
              },
              smallIcon: 'ic_stat_expenso',
              iconColor: '#6366F1'
            }
          ]
        });
        return true;
      }
    } catch (err) {
      console.warn('Native backup notification error:', err);
    }
    return false;
  }

  // Web Browser Notification Fallback
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/app-icon.png'
      });
      return true;
    } catch (err) {
      console.warn('Web backup notification error:', err);
    }
  }

  return false;
}


