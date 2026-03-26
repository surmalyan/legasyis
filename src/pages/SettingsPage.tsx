import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import type { NotificationFrequency } from "@/lib/notifications";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  isNotificationSupported,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  getNotificationPermission,
} from "@/lib/notifications";
import { Bell, BellOff, LogOut, ChevronLeft, Globe, Sun, Moon, Lock, Trash2, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const SettingsPage = () => {
  const { lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [notifEnabled, setNotifEnabled] = useState(false);
  const [frequency, setFrequency] = useState<NotificationFrequency>("daily");
  const [preferredHour, setPreferredHour] = useState(9);
  const [preferredMinute, setPreferredMinute] = useState(0);
  const [permissionState, setPermissionState] = useState<NotificationPermission | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  useEffect(() => {
    const settings = getNotificationSettings();
    setNotifEnabled(settings.enabled);
    setFrequency(settings.frequency);
    setPreferredHour(settings.preferredHour);
    setPreferredMinute(settings.preferredMinute);
    setPermissionState(getNotificationPermission());
  }, []);

  const handleToggleNotifications = async () => {
    if (!notifEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      saveNotificationSettings({ ...getNotificationSettings(), enabled: true, frequency });
      setNotifEnabled(true);
      setPermissionState("granted");
    } else {
      saveNotificationSettings({ ...getNotificationSettings(), enabled: false });
      setNotifEnabled(false);
    }
  };

  const handleFrequencyChange = (f: NotificationFrequency) => {
    setFrequency(f);
    saveNotificationSettings({ ...getNotificationSettings(), frequency: f });
  };

  const handleTimeChange = (h: number, m: number) => {
    setPreferredHour(h);
    setPreferredMinute(m);
    saveNotificationSettings({ ...getNotificationSettings(), preferredHour: h, preferredMinute: m });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error(lang === "ru" ? "Пароль должен быть не менее 6 символов" : "Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(lang === "ru" ? "Пароли не совпадают" : "Passwords don't match");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(lang === "ru" ? "Ошибка смены пароля" : "Failed to change password");
      } else {
        toast.success(lang === "ru" ? "Пароль успешно изменён" : "Password changed successfully");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      toast.error(lang === "ru" ? "Ошибка" : "Error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    toast.error(lang === "ru" 
      ? "Для удаления аккаунта напишите в поддержку" 
      : "To delete your account, contact support");
    setShowDeleteConfirm(false);
  };

  const t = {
    settings: lang === "ru" ? "Настройки" : "Settings",
    notifications: lang === "ru" ? "Уведомления" : "Notifications",
    notifDesc: lang === "ru"
      ? "Напоминание записать свою историю"
      : "Reminder to write your story",
    daily: lang === "ru" ? "Ежедневно" : "Daily",
    threePerWeek: lang === "ru" ? "3 раза/нед" : "3x/week",
    weekly: lang === "ru" ? "Еженедельно" : "Weekly",
    frequency: lang === "ru" ? "Частота" : "Frequency",
    account: lang === "ru" ? "Аккаунт" : "Account",
    signOut: lang === "ru" ? "Выйти" : "Sign Out",
    changePassword: lang === "ru" ? "Сменить пароль" : "Change Password",
    newPassword: lang === "ru" ? "Новый пароль" : "New password",
    confirmPassword: lang === "ru" ? "Подтвердите пароль" : "Confirm password",
    save: lang === "ru" ? "Сохранить" : "Save",
    deleteAccount: lang === "ru" ? "Удалить аккаунт" : "Delete Account",
    deleteWarning: lang === "ru" ? "Это действие необратимо. Все ваши данные будут удалены." : "This action is irreversible. All your data will be deleted.",
    cancel: lang === "ru" ? "Отмена" : "Cancel",
    confirm: lang === "ru" ? "Удалить" : "Delete",
    notSupported: lang === "ru"
      ? "Уведомления не поддерживаются в этом браузере"
      : "Notifications not supported in this browser",
    denied: lang === "ru"
      ? "Уведомления заблокированы в настройках браузера"
      : "Notifications blocked in browser settings",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center gap-3 px-6 pt-14 pb-6">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-foreground font-serif-display">{t.settings}</h1>
      </header>

      <main className="flex-1 px-6 pb-28 max-w-md mx-auto w-full space-y-6">
        {/* Language Section */}
        <section className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{lang === "ru" ? "Язык" : "Language"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(["ru", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] ${
                  lang === l
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {l === "ru" ? "Русский" : "English"}
              </button>
            ))}
          </div>
        </section>

        {/* Theme Section */}
        <section className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              {theme === "dark" ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{lang === "ru" ? "Тема" : "Theme"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] ${
                  theme === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {t === "light" ? (lang === "ru" ? "Светлая" : "Light") : (lang === "ru" ? "Тёмная" : "Dark")}
              </button>
            ))}
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              {notifEnabled ? <Bell size={18} className="text-primary" /> : <BellOff size={18} className="text-muted-foreground" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{t.notifications}</p>
              <p className="text-xs text-muted-foreground">{t.notifDesc}</p>
            </div>
          </div>

          {!isNotificationSupported() ? (
            <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3">{t.notSupported}</p>
          ) : permissionState === "denied" ? (
            <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3">{t.denied}</p>
          ) : (
            <>
              {/* Toggle */}
              <button
                onClick={handleToggleNotifications}
                className={`w-full rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] ${
                  notifEnabled
                    ? "bg-muted text-muted-foreground hover:bg-accent"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {notifEnabled
                  ? (lang === "ru" ? "Выключить" : "Disable")
                  : (lang === "ru" ? "Включить" : "Enable")}
              </button>

              {/* Frequency selector */}
              {notifEnabled && (
                <>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.frequency}</p>
                  <div className="flex gap-2">
                    {(["daily", "3x_week", "weekly"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => handleFrequencyChange(f)}
                        className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] ${
                          frequency === f
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {f === "daily" ? t.daily : f === "3x_week" ? t.threePerWeek : t.weekly}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {lang === "ru" ? "Время" : "Time"}
                  </p>
                  <div className="flex items-center gap-2">
                    <select
                      value={preferredHour}
                      onChange={(e) => handleTimeChange(Number(e.target.value), preferredMinute)}
                      className="flex-1 rounded-xl py-3 px-3 text-sm font-medium bg-muted text-foreground border border-border appearance-none text-center"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <span className="text-foreground font-semibold">:</span>
                    <select
                      value={preferredMinute}
                      onChange={(e) => handleTimeChange(preferredHour, Number(e.target.value))}
                      className="flex-1 rounded-xl py-3 px-3 text-sm font-medium bg-muted text-foreground border border-border appearance-none text-center"
                    >
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                      ))}
                    </select>
                  </div>
                </div>
                </>
              )}
            </>
          )}
        </section>

        {/* Change Password Section */}
        <section className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock size={18} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t.changePassword}</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t.newPassword}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.confirmPassword}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-40"
            >
              {changingPassword ? <Loader2 size={18} className="animate-spin" /> : t.save}
            </button>
          </div>
        </section>

        {/* Account Section */}
        <section className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.account}</p>
          {user?.email && (
            <p className="text-sm text-foreground truncate">{user.email}</p>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] hover:bg-destructive/20"
          >
            <LogOut size={18} />
            {t.signOut}
          </button>
        </section>

        {/* Delete Account Section */}
        <section className="bg-card rounded-2xl border border-destructive/30 p-5 space-y-4">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 text-destructive text-sm font-medium py-2 transition-colors hover:text-destructive/80"
            >
              <Trash2 size={16} />
              {t.deleteAccount}
            </button>
          ) : (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs text-destructive text-center">{t.deleteWarning}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl py-3 text-sm font-medium bg-muted text-muted-foreground hover:bg-accent transition-all active:scale-[0.97]"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 rounded-xl py-3 text-sm font-medium bg-destructive text-destructive-foreground transition-all active:scale-[0.97]"
                >
                  {t.confirm}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
