const NOTIFICATION_KEY = "diary-notifications";

export type NotificationFrequency = "daily" | "3x_week" | "weekly";

interface NotificationSettings {
  enabled: boolean;
  frequency: NotificationFrequency;
  lastShown?: string;
}

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(NOTIFICATION_KEY);
    return raw ? JSON.parse(raw) : { enabled: false, frequency: "daily" };
  } catch {
    return { enabled: false, frequency: "daily" };
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(settings));
}

export function isNotificationSupported(): boolean {
  return "Notification" in window && "serviceWorker" in navigator;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function getNotificationPermission(): NotificationPermission | null {
  if (!isNotificationSupported()) return null;
  return Notification.permission;
}

function getIntervalMs(frequency: NotificationFrequency): number {
  switch (frequency) {
    case "daily": return 20 * 60 * 60 * 1000; // 20h
    case "3x_week": return 2 * 24 * 60 * 60 * 1000; // ~2 days
    case "weekly": return 6 * 24 * 60 * 60 * 1000; // 6 days
  }
}

export async function scheduleNotification(lang: "ru" | "en") {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;
  if (Notification.permission !== "granted") return;

  const now = new Date();
  const last = settings.lastShown ? new Date(settings.lastShown) : null;
  const interval = getIntervalMs(settings.frequency);

  const shouldShow = !last || (now.getTime() - last.getTime() > interval);
  if (!shouldShow) return;

  const title = lang === "ru" ? "Мой Дневник" : "My Diary";
  const body = lang === "ru"
    ? "Готов поделиться историей из своей жизни?"
    : "Ready to share a story from your life?";

  const reg = await navigator.serviceWorker.ready;
  reg.showNotification(title, {
    body,
    icon: "/pwa-512.png",
    badge: "/pwa-192.png",
    tag: "diary-reminder",
    data: { url: "/" },
  });

  saveNotificationSettings({ ...settings, lastShown: now.toISOString() });
}
