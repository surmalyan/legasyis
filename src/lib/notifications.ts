const NOTIFICATION_KEY = "diary-notifications";

export type NotificationFrequency = "daily" | "3x_week" | "weekly";
export type NotificationCategory = "reminder" | "motivation" | "milestone";

interface NotificationSettings {
  enabled: boolean;
  frequency: NotificationFrequency;
  preferredHour: number; // 0-23
  preferredMinute: number; // 0-59
  lastShown?: string;
  categories: NotificationCategory[];
  motivationalQuotes: boolean;
  soundEnabled: boolean;
}

const DEFAULTS: NotificationSettings = {
  enabled: false,
  frequency: "daily",
  preferredHour: 9,
  preferredMinute: 0,
  categories: ["reminder", "motivation"],
  motivationalQuotes: true,
  soundEnabled: true,
};

export function getNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(NOTIFICATION_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
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

// ── Motivational messages ──

const motivationalMessagesRu = [
  "Ваша история — бесценное наследие для будущих поколений 📖",
  "Каждое воспоминание — это жемчужина, которую стоит сохранить ✨",
  "Напишите сегодня то, что ваши внуки прочитают с любовью 💝",
  "Ваш опыт уникален. Поделитесь им с миром 🌍",
  "Великие истории начинаются с маленьких воспоминаний 🌱",
  "Сегодня прекрасный день, чтобы вспомнить что-то важное 🌅",
  "Ваши слова — мост между прошлым и будущим 🌉",
  "Не откладывайте — запишите историю, пока она свежа в памяти 🎯",
  "Каждая глава вашей жизни заслуживает быть рассказанной 📚",
  "Ваши потомки будут благодарны за каждое записанное слово 🙏",
  "Живая история — это та, что записана вашим голосом 🎙",
  "Сегодняшний момент — завтрашнее воспоминание. Сохраните его 💫",
  "Ваша жизнь — самая интересная книга, которую вы когда-либо напишете 📕",
  "Даже маленькая запись сегодня — большой подарок завтра 🎁",
  "Вдохновение приходит, когда вы начинаете вспоминать 💡",
];

const motivationalMessagesEn = [
  "Your story is a priceless legacy for future generations 📖",
  "Every memory is a pearl worth preserving ✨",
  "Write today what your grandchildren will read with love 💝",
  "Your experience is unique. Share it with the world 🌍",
  "Great stories begin with small memories 🌱",
  "Today is a beautiful day to remember something important 🌅",
  "Your words are a bridge between past and future 🌉",
  "Don't delay — write the story while it's fresh in your mind 🎯",
  "Every chapter of your life deserves to be told 📚",
  "Your descendants will be grateful for every word you write 🙏",
  "A living story is one recorded in your voice 🎙",
  "Today's moment is tomorrow's memory. Save it 💫",
  "Your life is the most fascinating book you'll ever write 📕",
  "Even a small entry today is a big gift tomorrow 🎁",
  "Inspiration comes when you start to remember 💡",
];

const reminderMessagesRu = [
  "Готов поделиться историей из своей жизни?",
  "Пора записать новую главу вашей истории!",
  "Ваш дневник ждёт новую запись ✍️",
  "Уделите 5 минут своей истории сегодня",
  "Новый вопрос уже ждёт вас в дневнике!",
];

const reminderMessagesEn = [
  "Ready to share a story from your life?",
  "Time to write a new chapter of your story!",
  "Your diary awaits a new entry ✍️",
  "Spend 5 minutes on your story today",
  "A new question is waiting for you!",
];

function getRandomMessage(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getIntervalMs(frequency: NotificationFrequency): number {
  switch (frequency) {
    case "daily": return 20 * 60 * 60 * 1000; // 20h
    case "3x_week": return 2 * 24 * 60 * 60 * 1000;
    case "weekly": return 6 * 24 * 60 * 60 * 1000;
  }
}

export async function sendTestNotification(lang: "ru" | "en"): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== "granted") return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const title = lang === "ru" ? "Тестовое уведомление ✅" : "Test Notification ✅";
    const body = lang === "ru"
      ? "Уведомления работают! Вы будете получать напоминания в выбранное время."
      : "Notifications work! You'll receive reminders at your chosen time.";

    await reg.showNotification(title, {
      body,
      icon: "/pwa-512.png",
      badge: "/pwa-192.png",
      tag: "diary-test",
      data: { url: "/" },
    });
    return true;
  } catch {
    return false;
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

  // Check if we're within the preferred time window (±2 hours)
  const currentHour = now.getHours();
  const prefHour = settings.preferredHour;
  const hourDiff = Math.abs(currentHour - prefHour);
  if (hourDiff > 2 && hourDiff < 22) return; // outside window

  const categories = settings.categories || ["reminder"];
  const useMotivation = settings.motivationalQuotes !== false && categories.includes("motivation");

  const title = lang === "ru" ? "Legasy" : "Legasy";
  let body: string;

  if (useMotivation && Math.random() > 0.4) {
    body = getRandomMessage(lang === "ru" ? motivationalMessagesRu : motivationalMessagesEn);
  } else {
    body = getRandomMessage(lang === "ru" ? reminderMessagesRu : reminderMessagesEn);
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: "/pwa-512.png",
      badge: "/pwa-192.png",
      tag: "diary-reminder",
      data: { url: "/" },
      silent: !settings.soundEnabled,
    });

    saveNotificationSettings({ ...settings, lastShown: now.toISOString() });
  } catch {
    // silently fail
  }
}

// ── Milestone notifications ──

export async function sendMilestoneNotification(
  lang: "ru" | "en",
  entryCount: number
): Promise<void> {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.categories.includes("milestone")) return;
  if (Notification.permission !== "granted") return;

  const milestones = [5, 10, 25, 50, 100, 200, 500];
  if (!milestones.includes(entryCount)) return;

  const title = lang === "ru" ? "🎉 Достижение!" : "🎉 Milestone!";
  const body = lang === "ru"
    ? `Вы записали ${entryCount} историй! Продолжайте в том же духе!`
    : `You've written ${entryCount} stories! Keep it up!`;

  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: "/pwa-512.png",
      badge: "/pwa-192.png",
      tag: "diary-milestone",
      data: { url: "/" },
    });
  } catch {
    // silently fail
  }
}
