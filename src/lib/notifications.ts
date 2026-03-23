const NOTIFICATION_KEY = "diary-notifications";

interface NotificationSettings {
  enabled: boolean;
  frequency: "daily" | "weekly";
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

export async function scheduleNotification(lang: "ru" | "en") {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;
  if (Notification.permission !== "granted") return;

  const now = new Date();
  const last = settings.lastShown ? new Date(settings.lastShown) : null;

  const shouldShow = !last || (
    settings.frequency === "daily"
      ? now.getTime() - last.getTime() > 20 * 60 * 60 * 1000 // 20h
      : now.getTime() - last.getTime() > 6 * 24 * 60 * 60 * 1000 // 6 days
  );

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
