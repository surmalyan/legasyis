import { useState, useCallback, useEffect } from "react";
import AnimatedLogo from "@/components/AnimatedLogo";
import BackgroundPattern from "@/components/BackgroundPattern";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { getTodayQuestion, getRandomQuestion, chapterLabels, depthLabels } from "@/lib/diary-store";
import { useSubscription } from "@/hooks/use-subscription";
import { scheduleNotification } from "@/lib/notifications";
import { PenLine, Mic, RefreshCw, Settings, Sparkles, Plus, UserPlus, Heart, ChevronRight } from "lucide-react";
import NotificationBanner from "@/components/NotificationBanner";
import ChapterProgress from "@/components/ChapterProgress";
import BottomNav from "@/components/BottomNav";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import InviteContributorModal from "@/components/invite/InviteContributorModal";
import type { QuestionDepth } from "@/lib/questions";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MEMORIAL_QUESTIONS } from "@/lib/memorial-questions";
import { usePreservedStatus } from "@/hooks/use-preserved-status";
import LegacySecuredBadge from "@/components/LegacySecuredBadge";

const HomePage = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDepth, setSelectedDepth] = useState<QuestionDepth | undefined>(undefined);
  const [questionData, setQuestionData] = useState(() => getTodayQuestion(lang));
  const [isSwapping, setIsSwapping] = useState(false);
  const { loading, canCreate, remaining, isSubscribed, isTrial, trialDaysLeft } = useSubscription();
  const preserved = usePreservedStatus();
  const [memorialBooks, setMemorialBooks] = useState<Array<{
    id: string;
    person_name: string;
    person_birth_year: number | null;
    person_death_year: number | null;
    invite_code: string;
    creator_id: string;
    memoriesCount: number;
    contributorsCount: number;
  }>>([]);
  const [memorialLoading, setMemorialLoading] = useState(true);
  const TOTAL_QUESTIONS = MEMORIAL_QUESTIONS.length;
  const [inviteModal, setInviteModal] = useState<{
    open: boolean; code: string; circleId: string; personName: string;
  }>({ open: false, code: "", circleId: "", personName: "" });

  useEffect(() => {
    scheduleNotification(lang);
  }, [lang]);

  useEffect(() => {
    if (user) loadMemorialBooks();
  }, [user]);

  const loadMemorialBooks = async () => {
    setMemorialLoading(true);
    const { data: circles } = await supabase
      .from("memory_circles")
      .select("id, person_name, person_birth_year, person_death_year, invite_code, creator_id")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!circles || circles.length === 0) {
      setMemorialBooks([]);
      setMemorialLoading(false);
      return;
    }

    const enriched = await Promise.all(
      circles.map(async (c) => {
        const [{ count: mc }, { count: cc }] = await Promise.all([
          supabase.from("circle_memories").select("*", { count: "exact", head: true }).eq("circle_id", c.id),
          supabase.from("circle_members").select("*", { count: "exact", head: true }).eq("circle_id", c.id).eq("status", "active"),
        ]);
        return { ...c, memoriesCount: mc || 0, contributorsCount: (cc || 0) + 1 };
      })
    );
    setMemorialBooks(enriched);
    setMemorialLoading(false);
  };

  const openInvite = (book: { invite_code: string; id: string; person_name: string }, e: React.MouseEvent) => {
    e.stopPropagation();
    setInviteModal({ open: true, code: book.invite_code, circleId: book.id, personName: book.person_name });
  };

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
        <NotificationsBell />
        <AnimatedLogo size={80} className="logo-entrance" />
        <button onClick={() => navigate("/settings")} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Settings size={22} />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pb-28 pt-2">
        <div className="w-full max-w-md">
          <NotificationBanner />

          {!preserved.loading && preserved.isPreserved && (
            <div className="mb-4 flex justify-center animate-fade-in">
              <LegacySecuredBadge reason={preserved.reason} />
            </div>
          )}

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

          {/* === КНИГА ПАМЯТИ — ЦЕНТРАЛЬНЫЙ БЛОК === */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart size={14} className="text-primary" fill="currentColor" />
                <h2 className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">
                  {lang === "ru" ? "Книга Памяти" : "Memorial Heritage"}
                </h2>
              </div>
              {memorialBooks.length > 0 && (
                <button onClick={() => navigate("/memory-circle")}
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                  {lang === "ru" ? "Все" : "All"} <ChevronRight size={12} />
                </button>
              )}
            </div>

            {memorialLoading ? (
              <div className="bg-card border border-border rounded-3xl p-8 text-center text-sm text-muted-foreground">
                {lang === "ru" ? "Загрузка..." : "Loading..."}
              </div>
            ) : memorialBooks.length === 0 ? (
              <button
                onClick={() => navigate("/memorial/onboarding")}
                className="w-full bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-3xl p-6 text-left hover:shadow-md transition-all active:scale-[0.98] group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Heart size={22} className="text-primary" fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <p className="font-serif-display text-lg text-foreground leading-tight mb-1">
                      {lang === "ru" ? "Сохраните память о близком" : "Preserve the memory of someone dear"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {lang === "ru"
                        ? "Соберите истории, фото и голоса близких в одну книгу памяти"
                        : "Collect stories, photos and voices from loved ones into one heritage book"}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                      <Plus size={12} />
                      {lang === "ru" ? "Создать Книгу Памяти" : "Create Memorial Book"}
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <div className="space-y-3">
                {memorialBooks.map((book) => {
                  const years = [book.person_birth_year, book.person_death_year].filter(Boolean).join(" – ");
                  const progress = Math.min(100, Math.round((book.memoriesCount / TOTAL_QUESTIONS) * 100));
                  return (
                    <div
                      key={book.id}
                      className="bg-card border border-border rounded-3xl p-5 hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      <button
                        onClick={() => navigate(`/memory-circle/${book.id}`)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-serif-display text-primary">
                              {book.person_name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-serif-display text-base text-foreground truncate">
                              {book.person_name}
                            </p>
                            {years && <p className="text-[11px] text-muted-foreground">{years}</p>}
                          </div>
                          <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
                        </div>

                        {/* Mosaic progress */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                              {lang === "ru" ? "Мозаика памяти" : "Memory mosaic"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {book.memoriesCount}/{TOTAL_QUESTIONS}
                            </span>
                          </div>
                          <div className="grid grid-cols-[repeat(25,1fr)] gap-[2px]">
                            {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
                              <div
                                key={i}
                                className={`aspect-square rounded-[2px] transition-colors ${
                                  i < book.memoriesCount
                                    ? "bg-primary"
                                    : "bg-secondary"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="mt-1.5 text-[10px] text-muted-foreground">
                            {progress}% {lang === "ru" ? "наполнено" : "complete"}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>
                            👥 {book.contributorsCount} {lang === "ru" ? "соавтор(ов)" : "contributor(s)"}
                          </span>
                          <span>
                            💭 {book.memoriesCount} {lang === "ru" ? "историй" : "stories"}
                          </span>
                        </div>
                      </button>

                      <button
                        onClick={(e) => openInvite(book, e)}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-2xl py-2.5 text-xs font-semibold transition-colors"
                      >
                        <UserPlus size={14} />
                        {lang === "ru" ? "Пригласить соавтора" : "Invite contributor"}
                      </button>
                    </div>
                  );
                })}

                <button
                  onClick={() => navigate("/memorial/onboarding")}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 rounded-2xl py-3 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Plus size={14} />
                  {lang === "ru" ? "Новая Книга Памяти" : "New Memorial Book"}
                </button>
              </div>
            )}
          </section>

          {/* === ЛИЧНЫЙ ДНЕВНИК — ВТОРИЧНЫЙ БЛОК === */}
          <div className="flex items-center gap-2 mb-3">
            <PenLine size={14} className="text-muted-foreground" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              {lang === "ru" ? "Ваша история" : "Your story"}
            </h2>
          </div>

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

      <InviteContributorModal
        open={inviteModal.open}
        onClose={() => setInviteModal((p) => ({ ...p, open: false }))}
        inviteCode={inviteModal.code}
        circleId={inviteModal.circleId}
        personName={inviteModal.personName}
      />
    </div>
  );
};

export default HomePage;
