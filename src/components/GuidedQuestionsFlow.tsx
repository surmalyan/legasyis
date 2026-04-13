import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Send, X } from "lucide-react";
import {
  MEMORIAL_QUESTIONS,
  MEMORIAL_CATEGORIES,
  type MemorialCategory,
  type MemorialQuestion,
} from "@/lib/memorial-questions";

type Props = {
  lang: string;
  personName: string;
  onSubmit: (question: string, answer: string) => Promise<void>;
  onClose: () => void;
};

const GuidedQuestionsFlow = ({ lang, personName, onSubmit, onClose }: Props) => {
  const [phase, setPhase] = useState<"categories" | "questions">("categories");
  const [selectedCategory, setSelectedCategory] = useState<MemorialCategory | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [answered, setAnswered] = useState<Set<string>>(new Set());

  const categories = MEMORIAL_CATEGORIES[lang] || MEMORIAL_CATEGORIES.en;
  const categoryQuestions = selectedCategory
    ? MEMORIAL_QUESTIONS.filter((q) => q.category === selectedCategory)
    : [];
  const currentQ = categoryQuestions[currentIndex];

  const handleSelectCategory = (cat: MemorialCategory) => {
    setSelectedCategory(cat);
    setCurrentIndex(0);
    setAnswer("");
    setPhase("questions");
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !currentQ) return;
    setSubmitting(true);
    const questionText = currentQ.text[lang as "ru" | "en"] || currentQ.text.en;
    await onSubmit(questionText, answer.trim());
    setAnswered((prev) => new Set(prev).add(currentQ.id));
    setAnswer("");
    // Auto-advance to next unanswered
    const nextIdx = categoryQuestions.findIndex(
      (q, i) => i > currentIndex && !answered.has(q.id)
    );
    if (nextIdx >= 0) {
      setCurrentIndex(nextIdx);
    } else {
      // All done in category — go back
      setPhase("categories");
      setSelectedCategory(null);
    }
    setSubmitting(false);
  };

  const handleSkip = () => {
    if (currentIndex < categoryQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswer("");
    } else {
      setPhase("categories");
      setSelectedCategory(null);
    }
  };

  // Fullscreen category picker
  if (phase === "categories") {
    const allCats = Object.entries(categories) as [MemorialCategory, { label: string; emoji: string }][];
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-14 pb-4">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
          <p className="text-xs text-muted-foreground font-medium">
            {lang === "ru" ? "Вопросы о" : "Questions about"} {personName}
          </p>
          <div className="w-6" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h2 className="text-xl font-serif-display font-light text-foreground text-center mb-2">
            {lang === "ru" ? "Выберите тему" : "Choose a topic"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-10 max-w-xs">
            {lang === "ru"
              ? "Мы зададим несколько вопросов, чтобы помочь вспомнить важное"
              : "We'll ask a few questions to help you recall what matters"}
          </p>

          <div className="w-full max-w-sm space-y-3">
            {allCats.map(([key, { label, emoji }]) => {
              const questionsInCat = MEMORIAL_QUESTIONS.filter((q) => q.category === key);
              const answeredInCat = questionsInCat.filter((q) => answered.has(q.id)).length;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectCategory(key)}
                  className="w-full flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 text-left hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.98]"
                >
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {answeredInCat}/{questionsInCat.length} {lang === "ru" ? "ответов" : "answered"}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen single question
  if (!currentQ) return null;

  const questionText = currentQ.text[lang as "ru" | "en"] || currentQ.text.en;
  const catInfo = categories[selectedCategory!];
  const progress = `${currentIndex + 1}/${categoryQuestions.length}`;
  const isAnswered = answered.has(currentQ.id);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-14 pb-2">
        <button onClick={() => { setPhase("categories"); setSelectedCategory(null); setAnswer(""); }}
          className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">
            {catInfo.emoji} {catInfo.label}
          </p>
          <p className="text-[11px] text-muted-foreground">{progress}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={20} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-4">
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / categoryQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col px-6">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[1.5rem] leading-[1.4] font-serif-display font-light text-foreground text-center max-w-sm">
            {questionText}
          </p>
        </div>

        {/* Answer area */}
        <div className="pb-8 space-y-3">
          {isAnswered ? (
            <div className="text-center py-4">
              <span className="text-sm text-primary font-medium">
                ✓ {lang === "ru" ? "Ответ сохранён" : "Answer saved"}
              </span>
            </div>
          ) : (
            <>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={lang === "ru" ? "Ваш ответ..." : "Your answer..."}
                className="rounded-2xl min-h-[120px] text-base resize-none border-border focus:border-primary"
                autoFocus
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || submitting}
                  className="flex-1 rounded-2xl py-5"
                  size="lg"
                >
                  <Send size={16} className="mr-2" />
                  {lang === "ru" ? "Сохранить" : "Save"}
                </Button>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setAnswer(""); }}
              disabled={currentIndex === 0}
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 py-2 px-3"
            >
              ← {lang === "ru" ? "Назад" : "Back"}
            </button>
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground py-2 px-3"
            >
              {currentIndex < categoryQuestions.length - 1
                ? (lang === "ru" ? "Пропустить →" : "Skip →")
                : (lang === "ru" ? "Завершить" : "Finish")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedQuestionsFlow;
