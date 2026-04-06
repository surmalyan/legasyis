import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { activateStubSubscription } from "@/hooks/use-subscription";
import { Crown, Check, Loader2, Infinity, Mic, Users, BookMarked, Gift } from "lucide-react";
import StaticLogo from "@/components/StaticLogo";
import { toast } from "sonner";

type Plan = "monthly" | "yearly" | "gift";

const PaywallPage = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Plan>("yearly");
  const [giftEmail, setGiftEmail] = useState("");
  const [giftError, setGiftError] = useState("");

  const features = lang === "ru" ? [
    { icon: Infinity, text: "Безлимитные записи навсегда" },
    { icon: Mic, text: "Голосовой ввод и сохранение голоса" },
    { icon: Users, text: "Семейное древо и связи" },
    { icon: BookMarked, text: "Книга вашей жизни в конце года" },
  ] : [
    { icon: Infinity, text: "Unlimited entries forever" },
    { icon: Mic, text: "Voice input & voice preservation" },
    { icon: Users, text: "Family tree & connections" },
    { icon: BookMarked, text: "Your life book at end of year" },
  ];

  const plans: { id: Plan; name: string; price: string; note: string; badge?: string }[] = lang === "ru" ? [
    { id: "monthly", name: "Ежемесячно", price: "$14", note: "/мес · книга в конце года" },
    { id: "yearly", name: "Ежегодно", price: "$140", note: "/год · экономия $28 · книга в конце года", badge: "Выгодно" },
    { id: "gift", name: "Подарить на год", price: "$140", note: "подписка в подарок близкому" },
  ] : [
    { id: "monthly", name: "Monthly", price: "$14", note: "/mo · life book at year end" },
    { id: "yearly", name: "Yearly", price: "$140", note: "/yr · save $28 · life book at year end", badge: "Best value" },
    { id: "gift", name: "Gift a year", price: "$140", note: "gift subscription to a loved one" },
  ];

  const t = {
    headline: lang === "ru"
      ? "Сохрани свою историю\nдля будущих поколений"
      : "Preserve your story\nfor future generations",
    subtitle: lang === "ru"
      ? "Оформите подписку, чтобы продолжить сохранять воспоминания."
      : "Subscribe to keep preserving your memories.",
    cta: lang === "ru" ? "Оформить подписку" : "Subscribe Now",
    giftCta: lang === "ru" ? "Подарить подписку" : "Gift Subscription",
    later: lang === "ru" ? "Позже" : "Maybe later",
    stub: lang === "ru" ? "Заглушка — оплата не списывается" : "Stub — no real charge",
  };

  const handleSubscribe = async () => {
    if (selected === "gift") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!giftEmail.trim() || !emailRegex.test(giftEmail.trim())) {
        setGiftError(lang === "ru" ? "Введите корректный email" : "Enter a valid email");
        return;
      }
    }
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
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8 pt-12">
        <div className="relative mb-6 animate-fade-in">
          <StaticLogo size={80} />
          <div className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Crown size={18} className="text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-foreground text-center leading-snug mb-2 whitespace-pre-line animate-fade-in font-serif-display">
          {t.headline}
        </h1>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-6 animate-fade-in">
          {t.subtitle}
        </p>

        <div className="w-full max-w-sm space-y-3 mb-6 animate-fade-in">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon size={16} className="text-primary" />
              </div>
              <span className="text-sm text-foreground font-medium">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Plan selector */}
        <div className="w-full max-w-sm space-y-3 mb-6 animate-fade-in">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`w-full relative flex items-center gap-4 rounded-2xl border-2 px-5 py-4 transition-all text-left ${
                selected === plan.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selected === plan.id ? "border-primary bg-primary" : "border-muted-foreground/40"
              }`}>
                {selected === plan.id && <Check size={12} className="text-primary-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{plan.name}</span>
                  {plan.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                  {plan.id === "gift" && <Gift size={14} className="text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="text-lg font-bold text-foreground">{plan.price}</span>{" "}
                  {plan.note}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Gift email input */}
        {selected === "gift" && (
          <div className="w-full max-w-sm mb-4 animate-fade-in">
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              {lang === "ru" ? "Email получателя" : "Recipient's email"}
            </label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={giftEmail}
              onChange={(e) => { setGiftEmail(e.target.value); setGiftError(""); }}
              className={`rounded-xl ${giftError ? "border-destructive" : ""}`}
              maxLength={255}
            />
            {giftError && <p className="text-xs text-destructive mt-1">{giftError}</p>}
          </div>
        )}

        <p className="text-xs text-muted-foreground mb-4">{t.stub}</p>

        <button onClick={handleSubscribe} disabled={loading}
          className="w-full max-w-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-medium transition-all active:scale-[0.97] disabled:opacity-40">
          {loading ? <Loader2 size={22} className="animate-spin" /> : (selected === "gift" ? t.giftCta : t.cta)}
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
