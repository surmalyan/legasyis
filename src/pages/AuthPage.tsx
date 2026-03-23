import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import LanguageToggle from "@/components/LanguageToggle";
import InfinitySymbol from "@/components/InfinitySymbol";
import logo from "@/assets/logo.jpg";

const AuthPage = () => {
  const { lang } = useI18n();
  const [isLogin, setIsLogin] = useState(true);
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
  };

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
          <img src={logo} alt="MYLEGACY" className="w-28 h-28 object-contain mb-2" />
          <InfinitySymbol size={60} className="text-primary mb-3" />
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
      </main>
    </div>
  );
};

export default AuthPage;
