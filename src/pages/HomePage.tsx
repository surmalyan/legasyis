import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { getTodayQuestion, getRandomQuestion } from "@/lib/diary-store";
import { useSubscription } from "@/hooks/use-subscription";
import { scheduleNotification } from "@/lib/notifications";
import { PenLine, Mic, RefreshCw, Settings } from "lucide-react";
import NotificationBanner from "@/components/NotificationBanner";
import BottomNav from "@/components/BottomNav";
import logo from "@/assets/logo.png";

const HomePage = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(() => getTodayQuestion(lang));
  const [isSwapping, setIsSwapping] = useState(false);
  const { loading, canCreate, remaining, isSubscribed } = useSubscription();

  useEffect(() => {
    scheduleNotification(lang);
  }, [lang]);

  const handleNewQuestion = useCallback(() => {
    setIsSwapping(true);
    setTimeout(() => {
      setQuestion(getRandomQuestion(lang, question));
      setIsSwapping(false);
    }, 250);
  }, [lang, question]);

  const handleAction = (path: string, state: any) => {
    if (!canCreate) {
      navigate("/paywall");
      return;
    }
    navigate(path, { state });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-6 pt-14 pb-2">
        <div className="w-10" />
        <img src={logo} alt="MYLEGACY" className="h-12 object-contain logo-breathe" />
        <button onClick={() => navigate("/settings")} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Settings size={22} />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-28">
        <div className="w-full max-w-md">
          <NotificationBanner />
          <p className="text-sm text-muted-foreground font-medium text-center mb-1">
            {new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </p>

          <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold text-center mb-8">
            {t("questionOfTheDay")}
          </p>

          <div className={`bg-card rounded-3xl px-8 py-12 shadow-sm border border-border mb-4 transition-all duration-250 ${isSwapping ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
            <p className="text-[1.65rem] leading-[1.45] font-serif-display font-light text-foreground text-center">{question}</p>
          </div>

          <div className="flex justify-center mb-10">
            <button onClick={handleNewQuestion} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-4 rounded-xl">
              <RefreshCw size={15} className={isSwapping ? "animate-spin" : ""} />
              {lang === "ru" ? "Другой вопрос" : "Another question"}
            </button>
          </div>

          {!loading && !isSubscribed && (
            <div className="text-center mb-4">
              <p className="text-xs text-muted-foreground">
                {lang === "ru"
                  ? `Осталось бесплатных записей: ${remaining} из 3`
                  : `Free entries remaining: ${remaining} of 3`}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => handleAction("/entry", { question, mode: "text" })}
              className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-medium transition-all active:scale-[0.97] hover:opacity-90"
            >
              <PenLine size={22} />
              {t("writeAnswer")}
            </button>

            <button
              onClick={() => handleAction("/record", { question })}
              className="w-full flex items-center justify-center gap-3 bg-secondary text-secondary-foreground rounded-2xl py-5 text-lg font-medium transition-all active:scale-[0.97] hover:bg-accent"
            >
              <Mic size={22} />
              {t("recordAudio")}
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default HomePage;
