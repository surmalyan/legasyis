import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { activateStubSubscription } from "@/hooks/use-subscription";
import { BookOpen, Crown, Check, Loader2, Infinity, Mic, Users, BookMarked } from "lucide-react";
import { toast } from "sonner";

const PaywallPage = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const features = lang === "ru" ? [
    { icon: Infinity, text: "Безлимитные записи навсегда" },
    { icon: Mic, text: "Голосовой ввод и сохранение голоса" },
    { icon: Users, text: "Семейное древо и связи" },
    { icon: BookMarked, text: "Генерация книги из записей" },
  ] : [
    { icon: Infinity, text: "Unlimited entries forever" },
    { icon: Mic, text: "Voice input & voice preservation" },
    { icon: Users, text: "Family tree & connections" },
    { icon: BookMarked, text: "Book generation from entries" },
  ];

  const t = {
    headline: lang === "ru"
      ? "Сохрани свою историю\nдля будущих поколений"
      : "Preserve your story\nfor future generations",
    subtitle: lang === "ru"
      ? "Ваш пробный период закончился. Оформите подписку, чтобы продолжить сохранять воспоминания."
      : "Your trial has ended. Subscribe to keep preserving your memories.",
    price: lang === "ru" ? "299 ₽ / месяц" : "$2.99 / month",
    cta: lang === "ru" ? "Оформить подписку" : "Subscribe Now",
    later: lang === "ru" ? "Позже" : "Maybe later",
    stub: lang === "ru" ? "Заглушка — оплата не списывается" : "Stub — no real charge",
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await activateStubSubscription();
      toast.success(lang === "ru" ? "Подписка активирована!" : "Subscription activated!");
      navigate("/");
    } catch {
      toast.error(lang === "ru" ? "Ошибка" : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
        <div className="relative mb-8 animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen size={40} className="text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Crown size={20} className="text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-foreground text-center leading-snug mb-3 whitespace-pre-line animate-fade-in font-serif-display">
          {t.headline}
        </h1>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-10 animate-fade-in">
          {t.subtitle}
        </p>

        <div className="w-full max-w-sm space-y-4 mb-10 animate-fade-in">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon size={18} className="text-primary" />
              </div>
              <span className="text-sm text-foreground font-medium">{f.text}</span>
            </div>
          ))}
        </div>

        <p className="text-3xl font-semibold text-foreground mb-2">{t.price}</p>
        <p className="text-xs text-muted-foreground mb-8">{t.stub}</p>

        <button onClick={handleSubscribe} disabled={loading}
          className="w-full max-w-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-medium transition-all active:scale-[0.97] disabled:opacity-40">
          {loading ? <Loader2 size={22} className="animate-spin" /> : t.cta}
        </button>

        <button onClick={() => navigate("/")}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t.later}
        </button>
      </main>
    </div>
  );
};

export default PaywallPage;
