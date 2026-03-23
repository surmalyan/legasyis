import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { activateStubSubscription } from "@/hooks/use-subscription";
import { BookOpen, Crown, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PaywallPage = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const t = {
    headline: lang === "ru"
      ? "Сохрани свою историю\nдля будущих поколений"
      : "Preserve your story\nfor future generations",
    subtitle: lang === "ru"
      ? "Вы использовали 3 бесплатных записи. Оформите подписку, чтобы продолжить."
      : "You've used your 3 free entries. Subscribe to continue.",
    feature1: lang === "ru" ? "Безлимитные записи" : "Unlimited entries",
    feature2: lang === "ru" ? "AI-генерация историй" : "AI story generation",
    feature3: lang === "ru" ? "Архив всех воспоминаний" : "Archive of all memories",
    price: lang === "ru" ? "299 ₽ / месяц" : "$2.99 / month",
    cta: lang === "ru" ? "Оформить подписку" : "Subscribe",
    later: lang === "ru" ? "Позже" : "Maybe later",
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
        {/* Icon */}
        <div className="relative mb-8 animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen size={40} className="text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Crown size={20} className="text-primary-foreground" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-semibold text-foreground text-center leading-snug mb-3 whitespace-pre-line animate-fade-in">
          {t.headline}
        </h1>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-10 animate-fade-in">
          {t.subtitle}
        </p>

        {/* Features */}
        <div className="w-full max-w-sm space-y-4 mb-10 animate-fade-in">
          {[t.feature1, t.feature2, t.feature3].map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Check size={16} className="text-primary" />
              </div>
              <span className="text-base text-foreground">{feature}</span>
            </div>
          ))}
        </div>

        {/* Price */}
        <p className="text-3xl font-semibold text-foreground mb-2">{t.price}</p>
        <p className="text-xs text-muted-foreground mb-8">
          {lang === "ru" ? "Заглушка — оплата не списывается" : "Stub — no real charge"}
        </p>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full max-w-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-medium transition-all active:scale-[0.97] disabled:opacity-40"
        >
          {loading ? <Loader2 size={22} className="animate-spin" /> : t.cta}
        </button>

        <button
          onClick={() => navigate("/")}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t.later}
        </button>
      </main>
    </div>
  );
};

export default PaywallPage;
