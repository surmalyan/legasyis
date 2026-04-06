import { useState, useCallback, useEffect } from "react";
import AnimatedLogo from "@/components/AnimatedLogo";
import BackgroundPattern from "@/components/BackgroundPattern";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { getTodayQuestion, getRandomQuestion, chapterLabels, depthLabels } from "@/lib/diary-store";
import { useSubscription } from "@/hooks/use-subscription";
import { scheduleNotification } from "@/lib/notifications";
import { PenLine, Mic, RefreshCw, Settings, Sparkles } from "lucide-react";
import NotificationBanner from "@/components/NotificationBanner";
import ChapterProgress from "@/components/ChapterProgress";
import BottomNav from "@/components/BottomNav";
import type { QuestionDepth } from "@/lib/questions";

const HomePage = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [selectedDepth, setSelectedDepth] = useState<QuestionDepth | undefined>(undefined);
  const [questionData, setQuestionData] = useState(() => getTodayQuestion(lang));
  const [isSwapping, setIsSwapping] = useState(false);
  const { loading, canCreate, remaining, isSubscribed, isTrial, trialDaysLeft } = useSubscription();

  useEffect(() => {
    scheduleNotification(lang);
  }, [lang]);

  const handleNewQuestion = useCallback(() => {
    setIsSwapping(true);
    setTimeout(() => {
      setQuestionData(getRandomQuestion(lang, questionData.text, selectedDepth));
      setIsSwapping(false);
    }, 250);
  }, [lang, questionData.text, selectedDepth]);

  const handleDepthChange = (depth: QuestionDepth | undefined) => {
    setSelectedDepth(depth);
    setIsSwapping(true);
    setTimeout(() => {
      setQuestionData(depth ? getTodayQuestion(lang, depth) : getTodayQuestion(lang));
      setIsSwapping(false);
    }, 250);
  };

  const handleAction = (path: string, state: any) => {
    if (!canCreate) {
      navigate("/paywall");
      return;
    }
    navigate(path, { state });
  };

  const chapterLabel = chapterLabels[lang]?.[questionData.chapter] || questionData.chapter;

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <BackgroundPattern />
      <header className="flex items-center justify-between px-6 pt-14 pb-2 relative z-10">
        <div className="w-10" />
        <AnimatedLogo size={80} className="logo-entrance" />
        <button onClick={() => navigate("/settings")} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Settings size={22} />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-28">
        <div className="w-full max-w-md">
          <NotificationBanner />

          {/* Trial banner */}
          {!loading && isTrial && (
            <div className="mb-4 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">
                  {lang === "ru" ? "Пробный период" : "Free Trial"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {lang === "ru"
                    ? `${trialDaysLeft} дн. · ${remaining} из 7 записей`
                    : `${trialDaysLeft} days · ${remaining} of 7 entries`}
                </p>
              </div>
              <button onClick={() => navigate("/paywall")}
                className="text-[11px] font-semibold text-primary hover:underline flex-shrink-0">
                {lang === "ru" ? "Подписка" : "Subscribe"}
              </button>
            </div>
          )}

          <p className="text-sm text-muted-foreground font-medium text-center mb-1">
            {new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </p>

          <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold text-center mb-2">
            {t("questionOfTheDay")}
          </p>

          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-medium tracking-wide">
              {chapterLabel}
            </span>
          </div>

          {/* Depth selector */}
          <div className="flex justify-center gap-2 mb-6">
            {([1, 2, 3] as QuestionDepth[]).map((d) => (
              <button
                key={d}
                onClick={() => handleDepthChange(selectedDepth === d ? undefined : d)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                  selectedDepth === d
                    ? d === 1 ? "bg-green-500/15 text-green-700 dark:text-green-400 ring-1 ring-green-500/30"
                    : d === 2 ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30"
                    : "bg-red-500/15 text-red-700 dark:text-red-400 ring-1 ring-red-500/30"
                    : "bg-secondary text-muted-foreground hover:bg-accent"
                }`}
              >
                {d === 1 ? "🌱" : d === 2 ? "🌿" : "🌳"} {depthLabels[lang]?.[d]}
              </button>
            ))}
          </div>

          <div className={`bg-card rounded-3xl px-8 py-12 shadow-sm border border-border mb-4 transition-all duration-250 ${isSwapping ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
            <p className="text-[1.65rem] leading-[1.45] font-serif-display font-light text-foreground text-center">{questionData.text}</p>
          </div>

          <div className="flex justify-center mb-10">
            <button onClick={handleNewQuestion} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-4 rounded-xl">
              <RefreshCw size={15} className={isSwapping ? "animate-spin" : ""} />
              {lang === "ru" ? "Другой вопрос" : "Another question"}
            </button>
          </div>

          {!loading && !isSubscribed && !isTrial && remaining > 0 && (
            <div className="text-center mb-4">
              <p className="text-xs text-muted-foreground">
                {lang === "ru"
                  ? `Осталось записей: ${remaining} из 7`
                  : `Entries remaining: ${remaining} of 7`}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => handleAction("/entry", { question: questionData.text, chapter: questionData.chapter, mode: "text" })}
              className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-medium transition-all active:scale-[0.97] hover:opacity-90"
            >
              <PenLine size={22} />
              {t("writeAnswer")}
            </button>

            <button
              onClick={() => handleAction("/record", { question: questionData.text, chapter: questionData.chapter })}
              className="w-full flex items-center justify-center gap-3 bg-secondary text-secondary-foreground rounded-2xl py-5 text-lg font-medium transition-all active:scale-[0.97] hover:bg-accent"
            >
              <Mic size={22} />
              {t("recordAudio")}
            </button>
          </div>

          {/* Chapter progress map */}
          <div className="mt-8">
            <ChapterProgress />
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default HomePage;
