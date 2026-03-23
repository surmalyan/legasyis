import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import LanguageToggle from "@/components/LanguageToggle";
import logo from "@/assets/logo.png";

const AuthPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useI18n();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const t = {
    subtitle: lang === "ru" ? "Сохрани свою историю для будущих поколений" : "Preserve your story for future generations",
    login: lang === "ru" ? "Войти" : "Sign In",
    signup: lang === "ru" ? "Создать аккаунт" : "Sign Up",
    email: lang === "ru" ? "Электронная почта" : "Email",
    password: lang === "ru" ? "Пароль" : "Password",
    switchToSignup: lang === "ru" ? "Нет аккаунта? Создать" : "No account? Sign up",
    switchToLogin: lang === "ru" ? "Уже есть аккаунт? Войти" : "Already have an account? Sign in",
    checkEmail: lang === "ru" ? "Проверьте почту для подтверждения" : "Check your email to confirm",
    error: lang === "ru" ? "Произошла ошибка" : "Something went wrong",
    invalidCredentials: lang === "ru" ? "Неверный email или пароль" : "Invalid email or password",
    forgotPassword: lang === "ru" ? "Забыли пароль?" : "Forgot password?",
    resetSent: lang === "ru" ? "Ссылка для сброса отправлена на почту" : "Reset link sent to your email",
    sendReset: lang === "ru" ? "Отправить ссылку" : "Send reset link",
    backToLogin: lang === "ru" ? "Назад к входу" : "Back to sign in",
  };

  if (!authLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(t.invalidCredentials);
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) {
          toast.error(t.error);
        } else {
          toast.success(t.checkEmail);
        }
      }
    } catch {
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex justify-end px-6 pt-14 pb-2">
        <LanguageToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12 animate-fade-in">
          <div className="logo-breathe mb-4">
            <img src={logo} alt="MYLEGACY" className="w-36 h-36 object-contain rounded-full" />
          </div>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-[260px]">{t.subtitle}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 animate-fade-in">
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.email}
              disabled={loading}
              className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-60"
            />
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password}
              disabled={loading}
              className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 text-lg font-medium transition-all active:scale-[0.97] disabled:opacity-40"
          >
            {loading ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              isLogin ? t.login : t.signup
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-center text-sm text-muted-foreground py-2 hover:text-foreground transition-colors"
          >
            {isLogin ? t.switchToSignup : t.switchToLogin}
          </button>
        </form>

        {/* Divider */}
        <div className="w-full max-w-sm flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">{lang === "ru" ? "или" : "or"}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* OAuth buttons */}
        <div className="w-full max-w-sm space-y-3 animate-fade-in">
          <button
            type="button"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) toast.error(t.error);
            }}
            className="w-full flex items-center justify-center gap-3 bg-card border border-border rounded-2xl py-4 text-base font-medium text-foreground transition-all active:scale-[0.97] hover:bg-accent"
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {lang === "ru" ? "Войти через Google" : "Sign in with Google"}
          </button>

          <button
            type="button"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("apple", {
                redirect_uri: window.location.origin,
              });
              if (error) toast.error(t.error);
            }}
            className="w-full flex items-center justify-center gap-3 bg-card border border-border rounded-2xl py-4 text-base font-medium text-foreground transition-all active:scale-[0.97] hover:bg-accent"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            {lang === "ru" ? "Войти через Apple" : "Sign in with Apple"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
