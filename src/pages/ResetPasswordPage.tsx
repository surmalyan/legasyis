import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const ResetPasswordPage = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const t = {
    title: lang === "ru" ? "Новый пароль" : "New Password",
    placeholder: lang === "ru" ? "Введите новый пароль" : "Enter new password",
    submit: lang === "ru" ? "Сохранить пароль" : "Save Password",
    success: lang === "ru" ? "Пароль обновлён!" : "Password updated!",
    goHome: lang === "ru" ? "На главную" : "Go to home",
    error: lang === "ru" ? "Ошибка обновления пароля" : "Failed to update password",
    invalid: lang === "ru" ? "Недействительная ссылка для сброса" : "Invalid reset link",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || password.length < 6) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(t.error);
      } else {
        setSuccess(true);
      }
    } catch {
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8">
        <img src={logo} alt="Legacy" className="w-24 h-24 object-contain rounded-full mb-6" />
        <p className="text-muted-foreground text-center">{t.invalid}</p>
        <button onClick={() => navigate("/auth")} className="mt-4 text-primary underline text-sm">
          {lang === "ru" ? "Вернуться к входу" : "Back to sign in"}
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8 animate-fade-in">
        <CheckCircle size={48} className="text-primary mb-4" />
        <h1 className="text-xl font-semibold text-foreground font-serif-display mb-2">{t.success}</h1>
        <button onClick={() => navigate("/")} className="mt-4 bg-primary text-primary-foreground rounded-2xl px-8 py-3 font-medium">
          {t.goHome}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8">
      <div className="logo-breathe mb-6">
        <img src={logo} alt="MYLEGACY" className="w-24 h-24 object-contain rounded-full" />
      </div>
      <h1 className="text-xl font-semibold text-foreground font-serif-display mb-6">{t.title}</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.placeholder}
            minLength={6}
            disabled={loading}
            className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={loading || password.length < 6}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 text-lg font-medium transition-all active:scale-[0.97] disabled:opacity-40"
        >
          {loading ? <Loader2 size={22} className="animate-spin" /> : t.submit}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
