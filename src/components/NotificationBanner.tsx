import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import {
  isNotificationSupported,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  getNotificationPermission,
} from "@/lib/notifications";
import { Bell, BellOff, X } from "lucide-react";

const NotificationBanner = () => {
  const { lang } = useI18n();
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;
    const perm = getNotificationPermission();
    const settings = getNotificationSettings();
    setEnabled(settings.enabled && perm === "granted");

    // Show banner if never asked
    if (perm === "default" && !settings.enabled) {
      const dismissed = localStorage.getItem("diary-notif-dismissed");
      if (!dismissed) setVisible(true);
    }
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      saveNotificationSettings({ ...getNotificationSettings(), enabled: true, frequency: "daily" });
      setEnabled(true);
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("diary-notif-dismissed", "true");
  };

  const t = {
    title: lang === "ru" ? "Напоминания" : "Reminders",
    desc: lang === "ru"
      ? "Получайте ежедневное напоминание записать свою историю"
      : "Get a daily reminder to write your story",
    enable: lang === "ru" ? "Включить" : "Enable",
    enabled: lang === "ru" ? "Уведомления включены" : "Notifications enabled",
  };

  if (!isNotificationSupported()) return null;

  if (enabled) return null;

  if (!visible) return null;

  return (
    <div className="w-full max-w-md mx-auto bg-card border border-border rounded-2xl p-5 mb-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Bell size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground mb-0.5">{t.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
        </div>
        <button onClick={handleDismiss} className="p-1 text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </div>
      <button
        onClick={handleEnable}
        className="mt-3 w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97]"
      >
        {t.enable}
      </button>
    </div>
  );
};

export default NotificationBanner;
