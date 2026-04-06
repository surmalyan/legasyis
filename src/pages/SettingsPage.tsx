import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import type { NotificationFrequency, NotificationCategory } from "@/lib/notifications";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  isNotificationSupported,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  getNotificationPermission,
  sendTestNotification,
} from "@/lib/notifications";
import {
  Bell, BellOff, LogOut, ChevronLeft, Globe, Sun, Moon, Lock, Trash2, Loader2,
  Send, Volume2, VolumeX, Trophy, MessageSquareHeart, Clock, Shield, Eye, EyeOff,
  KeyRound, Smartphone, CheckCircle2, XCircle, Info,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import StaticLogo from "@/components/StaticLogo";

// Password strength checker
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: "weak", color: "bg-destructive" };
  if (score <= 2) return { score: 2, label: "fair", color: "bg-orange-400" };
  if (score <= 3) return { score: 3, label: "good", color: "bg-yellow-400" };
  if (score <= 4) return { score: 4, label: "strong", color: "bg-green-400" };
  return { score: 5, label: "very_strong", color: "bg-green-600" };
}

const SettingsPage = () => {
  const { lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Notifications state
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [frequency, setFrequency] = useState<NotificationFrequency>("daily");
  const [preferredHour, setPreferredHour] = useState(9);
  const [preferredMinute, setPreferredMinute] = useState(0);
  const [permissionState, setPermissionState] = useState<NotificationPermission | null>(null);
  const [categories, setCategories] = useState<NotificationCategory[]>(["reminder", "motivation"]);
  const [motivationalQuotes, setMotivationalQuotes] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testingSending, setTestingSending] = useState(false);

  // Security state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<string>("email");

  useEffect(() => {
    const settings = getNotificationSettings();
    setNotifEnabled(settings.enabled);
    setFrequency(settings.frequency);
    setPreferredHour(settings.preferredHour);
    setPreferredMinute(settings.preferredMinute);
    setCategories(settings.categories || ["reminder", "motivation"]);
    setMotivationalQuotes(settings.motivationalQuotes !== false);
    setSoundEnabled(settings.soundEnabled !== false);
    setPermissionState(getNotificationPermission());
  }, []);

  useEffect(() => {
    if (user) {
      setLastSignIn(user.last_sign_in_at || null);
      const provider = user.app_metadata?.provider || "email";
      setAuthProvider(provider);
    }
  }, [user]);

  const updateSettings = (patch: Partial<ReturnType<typeof getNotificationSettings>>) => {
    const current = getNotificationSettings();
    saveNotificationSettings({ ...current, ...patch });
  };

  const handleToggleNotifications = async () => {
    if (!notifEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast.error(lang === "ru" ? "Разрешение не получено" : "Permission not granted");
        return;
      }
      updateSettings({ enabled: true });
      setNotifEnabled(true);
      setPermissionState("granted");
      toast.success(lang === "ru" ? "Уведомления включены!" : "Notifications enabled!");
    } else {
      updateSettings({ enabled: false });
      setNotifEnabled(false);
      toast.info(lang === "ru" ? "Уведомления выключены" : "Notifications disabled");
    }
  };

  const handleFrequencyChange = (f: NotificationFrequency) => {
    setFrequency(f);
    updateSettings({ frequency: f });
  };

  const handleTimeChange = (h: number, m: number) => {
    setPreferredHour(h);
    setPreferredMinute(m);
    updateSettings({ preferredHour: h, preferredMinute: m });
  };

  const handleCategoryToggle = (cat: NotificationCategory) => {
    const newCats = categories.includes(cat)
      ? categories.filter((c) => c !== cat)
      : [...categories, cat];
    if (newCats.length === 0) return;
    setCategories(newCats);
    updateSettings({ categories: newCats });
  };

  const handleMotivationalToggle = () => {
    const val = !motivationalQuotes;
    setMotivationalQuotes(val);
    updateSettings({ motivationalQuotes: val });
  };

  const handleSoundToggle = () => {
    const val = !soundEnabled;
    setSoundEnabled(val);
    updateSettings({ soundEnabled: val });
  };

  const handleTestNotification = async () => {
    setTestingSending(true);
    const success = await sendTestNotification(lang);
    setTestingSending(false);
    if (success) {
      toast.success(lang === "ru" ? "Тестовое уведомление отправлено!" : "Test notification sent!");
    } else {
      toast.error(lang === "ru" ? "Не удалось отправить" : "Failed to send");
    }
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

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(lang === "ru" ? "Ошибка отправки" : "Failed to send");
      } else {
        toast.success(lang === "ru" ? "Ссылка для сброса отправлена на почту" : "Reset link sent to your email");
      }
    } catch {
      toast.error(lang === "ru" ? "Ошибка" : "Error");
    }
  };

  const handleDeleteAccount = async () => {
    toast.error(lang === "ru"
      ? "Для удаления аккаунта напишите в поддержку"
      : "To delete your account, contact support");
    setShowDeleteConfirm(false);
  };

  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : null;

  const strengthLabels: Record<string, Record<string, string>> = {
    ru: { weak: "Слабый", fair: "Средний", good: "Хороший", strong: "Надёжный", very_strong: "Очень надёжный" },
    en: { weak: "Weak", fair: "Fair", good: "Good", strong: "Strong", very_strong: "Very strong" },
  };

  const categoryItems: { key: NotificationCategory; icon: typeof Bell; label: string; desc: string }[] = [
    {
      key: "reminder",
      icon: Clock,
      label: lang === "ru" ? "Напоминания" : "Reminders",
      desc: lang === "ru" ? "Напоминание записать историю" : "Reminders to write your story",
    },
    {
      key: "motivation",
      icon: MessageSquareHeart,
      label: lang === "ru" ? "Мотивация" : "Motivation",
      desc: lang === "ru" ? "Вдохновляющие цитаты и мысли" : "Inspirational quotes and thoughts",
    },
    {
      key: "milestone",
      icon: Trophy,
      label: lang === "ru" ? "Достижения" : "Milestones",
      desc: lang === "ru" ? "Уведомления о ваших успехах" : "Notifications about your achievements",
    },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const providerLabels: Record<string, string> = {
    email: lang === "ru" ? "Email и пароль" : "Email & Password",
    google: "Google",
    apple: "Apple",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center gap-3 px-6 pt-14 pb-6">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <StaticLogo size={32} />
        <h1 className="text-lg font-semibold tracking-tight text-foreground font-serif-display">
          {lang === "ru" ? "Настройки" : "Settings"}
        </h1>
      </header>

      <main className="flex-1 px-6 pb-28 max-w-md mx-auto w-full space-y-6">

        {/* ═══════════════════════ Language ═══════════════════════ */}
        <section className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe size={18} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">{lang === "ru" ? "Язык" : "Language"}</p>
          </div>
          <div className="flex gap-2">
            {(["ru", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] ${
                  lang === l ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {l === "ru" ? "Русский" : "English"}
              </button>
            ))}
          </div>
        </section>

        {/* ═══════════════════════ Theme ═══════════════════════ */}
        <section className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              {theme === "dark" ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
            </div>
            <p className="text-sm font-semibold text-foreground">{lang === "ru" ? "Тема" : "Theme"}</p>
          </div>
          <div className="flex gap-2">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] ${
                  theme === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {t === "light" ? (lang === "ru" ? "Светлая" : "Light") : (lang === "ru" ? "Тёмная" : "Dark")}
              </button>
            ))}
          </div>
        </section>

        {/* ═══════════════════════ Notifications ═══════════════════════ */}
        <section className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              {notifEnabled ? <Bell size={18} className="text-primary" /> : <BellOff size={18} className="text-muted-foreground" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{lang === "ru" ? "Уведомления" : "Notifications"}</p>
              <p className="text-xs text-muted-foreground">{lang === "ru" ? "Напоминание записать свою историю" : "Reminder to write your story"}</p>
            </div>
          </div>

          {!isNotificationSupported() ? (
            <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3">
              {lang === "ru" ? "Уведомления не поддерживаются в этом браузере" : "Notifications not supported in this browser"}
            </p>
          ) : permissionState === "denied" ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3">
                {lang === "ru" ? "Уведомления заблокированы в настройках браузера" : "Notifications blocked in browser settings"}
              </p>
              <p className="text-xs text-muted-foreground px-1">
                {lang === "ru"
                  ? "Откройте настройки браузера → Сайты → Уведомления → разрешите для этого сайта"
                  : "Open browser settings → Sites → Notifications → allow for this site"}
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={handleToggleNotifications}
                className={`w-full rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] ${
                  notifEnabled ? "bg-muted text-muted-foreground hover:bg-accent" : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {notifEnabled
                  ? (lang === "ru" ? "Выключить уведомления" : "Disable Notifications")
                  : (lang === "ru" ? "Включить уведомления" : "Enable Notifications")}
              </button>

              {notifEnabled && (
                <div className="space-y-5 animate-fade-in">
                  {/* Frequency */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{lang === "ru" ? "Частота" : "Frequency"}</p>
                    <div className="flex gap-2">
                      {(["daily", "3x_week", "weekly"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => handleFrequencyChange(f)}
                          className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] ${
                            frequency === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {f === "daily" ? (lang === "ru" ? "Ежедневно" : "Daily") : f === "3x_week" ? (lang === "ru" ? "3 раза/нед" : "3x/week") : (lang === "ru" ? "Еженедельно" : "Weekly")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {lang === "ru" ? "Предпочтительное время" : "Preferred Time"}
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

                  {/* Categories */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {lang === "ru" ? "Типы уведомлений" : "Notification Types"}
                    </p>
                    <div className="space-y-2">
                      {categoryItems.map((item) => {
                        const Icon = item.icon;
                        const active = categories.includes(item.key);
                        return (
                          <button
                            key={item.key}
                            onClick={() => handleCategoryToggle(item.key)}
                            className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                              active ? "bg-primary/10 border border-primary/20" : "bg-muted border border-transparent"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? "bg-primary/20" : "bg-muted-foreground/10"}`}>
                              <Icon size={16} className={active ? "text-primary" : "text-muted-foreground"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              active ? "border-primary bg-primary" : "border-muted-foreground/30"
                            }`}>
                              {active && <div className="w-2 h-2 bg-primary-foreground rounded-full" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Extra toggles */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquareHeart size={16} className="text-muted-foreground" />
                        <span className="text-sm text-foreground">{lang === "ru" ? "Вдохновляющие цитаты" : "Inspirational quotes"}</span>
                      </div>
                      <button onClick={handleMotivationalToggle} className={`relative w-11 h-6 rounded-full transition-colors ${motivationalQuotes ? "bg-primary" : "bg-muted"}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${motivationalQuotes ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {soundEnabled ? <Volume2 size={16} className="text-muted-foreground" /> : <VolumeX size={16} className="text-muted-foreground" />}
                        <span className="text-sm text-foreground">{lang === "ru" ? "Звук уведомлений" : "Notification sound"}</span>
                      </div>
                      <button onClick={handleSoundToggle} className={`relative w-11 h-6 rounded-full transition-colors ${soundEnabled ? "bg-primary" : "bg-muted"}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${soundEnabled ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Test */}
                  <button
                    onClick={handleTestNotification}
                    disabled={testingSending}
                    className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] hover:opacity-90 disabled:opacity-40"
                  >
                    {testingSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {lang === "ru" ? "Отправить тестовое уведомление" : "Send test notification"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ═══════════════════════ SECURITY ═══════════════════════ */}
        <section className="bg-card rounded-2xl border border-border p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{lang === "ru" ? "Безопасность" : "Security"}</p>
              <p className="text-xs text-muted-foreground">{lang === "ru" ? "Пароль, сессии и защита аккаунта" : "Password, sessions & account protection"}</p>
            </div>
          </div>

          {/* Auth Provider Info */}
          <div className="bg-muted rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {lang === "ru" ? "Способ входа" : "Sign-in Method"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" />
              <span className="text-sm text-foreground">{providerLabels[authProvider] || authProvider}</span>
            </div>
            {lastSignIn && (
              <p className="text-xs text-muted-foreground">
                {lang === "ru" ? "Последний вход: " : "Last sign-in: "}{formatDate(lastSignIn)}
              </p>
            )}
            {user?.email && (
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            )}
          </div>

          {/* Change Password */}
          {authProvider === "email" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {lang === "ru" ? "Сменить пароль" : "Change Password"}
                </span>
              </div>

              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={lang === "ru" ? "Новый пароль" : "New password"}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength indicator */}
              {newPassword && passwordStrength && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength.score ? passwordStrength.color : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {strengthLabels[lang]?.[passwordStrength.label] || passwordStrength.label}
                  </p>
                </div>
              )}

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={lang === "ru" ? "Подтвердите пароль" : "Confirm password"}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password match indicator */}
              {confirmPassword && (
                <div className="flex items-center gap-1.5 animate-fade-in">
                  {newPassword === confirmPassword ? (
                    <>
                      <CheckCircle2 size={14} className="text-green-500" />
                      <span className="text-xs text-green-600">{lang === "ru" ? "Пароли совпадают" : "Passwords match"}</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} className="text-destructive" />
                      <span className="text-xs text-destructive">{lang === "ru" ? "Пароли не совпадают" : "Passwords don't match"}</span>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-40"
              >
                {changingPassword ? <Loader2 size={18} className="animate-spin" /> : (lang === "ru" ? "Сохранить новый пароль" : "Save New Password")}
              </button>

              {/* Reset via email */}
              <div className="pt-1">
                <button
                  onClick={handleResetPassword}
                  className="w-full text-center text-xs text-primary hover:underline"
                >
                  {lang === "ru" ? "Забыли пароль? Отправить ссылку для сброса" : "Forgot password? Send reset link"}
                </button>
              </div>
            </div>
          )}

          {/* OAuth users — no password change, but show info */}
          {authProvider !== "email" && (
            <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3">
              <Info size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === "ru"
                  ? `Вы вошли через ${providerLabels[authProvider]}. Управление паролем доступно в настройках вашего аккаунта ${providerLabels[authProvider]}.`
                  : `You signed in with ${providerLabels[authProvider]}. Password management is available in your ${providerLabels[authProvider]} account settings.`}
              </p>
            </div>
          )}

          {/* 2FA Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {lang === "ru" ? "Двухфакторная аутентификация" : "Two-Factor Authentication"}
              </span>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                <p className="text-sm font-medium text-foreground">
                  {lang === "ru" ? "Дополнительная защита" : "Extra Protection"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === "ru"
                  ? "Двухфакторная аутентификация (2FA) добавляет дополнительный уровень безопасности. При входе потребуется ввести код из приложения-аутентификатора помимо пароля."
                  : "Two-factor authentication (2FA) adds an extra layer of security. You'll need to enter a code from an authenticator app in addition to your password."}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-xs text-muted-foreground">
                  {lang === "ru" ? "Скоро будет доступно" : "Coming soon"}
                </span>
              </div>
            </div>

            {/* Password tips */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {lang === "ru" ? "💡 Советы по безопасности:" : "💡 Security tips:"}
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>{lang === "ru" ? "Используйте пароль длиной от 10 символов" : "Use a password at least 10 characters long"}</li>
                <li>{lang === "ru" ? "Добавьте заглавные буквы, цифры и спецсимволы" : "Include uppercase letters, numbers, and special characters"}</li>
                <li>{lang === "ru" ? "Не используйте один пароль для разных сайтов" : "Don't reuse passwords across sites"}</li>
                <li>{lang === "ru" ? "Регулярно обновляйте пароль" : "Update your password regularly"}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ Account ═══════════════════════ */}
        <section className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{lang === "ru" ? "Аккаунт" : "Account"}</p>
          {user?.email && (
            <p className="text-sm text-foreground truncate">{user.email}</p>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] hover:bg-destructive/20"
          >
            <LogOut size={18} />
            {lang === "ru" ? "Выйти" : "Sign Out"}
          </button>
        </section>

        {/* ═══════════════════════ Delete Account ═══════════════════════ */}
        <section className="bg-card rounded-2xl border border-destructive/30 p-5 space-y-4">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 text-destructive text-sm font-medium py-2 transition-colors hover:text-destructive/80"
            >
              <Trash2 size={16} />
              {lang === "ru" ? "Удалить аккаунт" : "Delete Account"}
            </button>
          ) : (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs text-destructive text-center">
                {lang === "ru" ? "Это действие необратимо. Все ваши данные будут удалены." : "This action is irreversible. All your data will be deleted."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 rounded-xl py-3 text-sm font-medium bg-muted text-muted-foreground hover:bg-accent transition-all active:scale-[0.97]"
                >
                  {lang === "ru" ? "Отмена" : "Cancel"}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 rounded-xl py-3 text-sm font-medium bg-destructive text-destructive-foreground transition-all active:scale-[0.97]"
                >
                  {lang === "ru" ? "Удалить" : "Delete"}
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
