import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { saveEntryToDb } from "@/lib/diary-store";
import { classifyAnswer } from "@/lib/ai-service";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

const EntryPage = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const question = (location.state as any)?.question || "";

  const [answer, setAnswer] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!answer.trim()) return;

    try {
      setIsSaving(true);
      
      // Classify into a chapter, keep raw text
      const { chapter } = await classifyAnswer(answer, question, lang);

      const id = await saveEntryToDb({
        question,
        original_text: answer,
        ai_story: answer, // Save raw text, no embellishment
        chapter,
      });

      setIsSaving(false);
      navigate("/result", {
        state: {
          entry: {
            id,
            date: new Date().toISOString(),
            question,
            answer,
            story: answer,
            chapter,
          },
        },
      });
    } catch (err: any) {
      setIsSaving(false);
      if (err.message === "rate_limited") {
        toast.error(lang === "ru" ? "Слишком много запросов. Подождите немного." : "Too many requests. Please wait a moment.");
      } else if (err.message === "payment_required") {
        toast.error(lang === "ru" ? "Необходимо пополнить баланс." : "Credits need to be topped up.");
      } else {
        toast.error(lang === "ru" ? "Произошла ошибка. Попробуйте ещё раз." : "Something went wrong. Please try again.");
      }
      console.error("Save error:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center gap-3 px-6 pt-14 pb-4">
        <button
          onClick={() => navigate(-1)}
          disabled={isSaving}
          className="p-2 -ml-2 rounded-xl text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{t("writeAnswer")}</h1>
      </header>

      <main className="flex-1 flex flex-col px-6 pb-8">
        <div className="bg-diary-warm-light rounded-2xl p-5 mb-6 animate-fade-in">
          <p className="text-base text-accent-foreground font-medium leading-relaxed">{question}</p>
        </div>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={t("yourAnswer")}
          disabled={isSaving}
          className="flex-1 min-h-[200px] w-full bg-card border border-border rounded-2xl p-5 text-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-60"
        />

        <button
          onClick={handleSave}
          disabled={!answer.trim() || isSaving}
          className="mt-6 w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-medium transition-all active:scale-[0.97] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 size={22} className="animate-spin" />
              {lang === "ru" ? "Сохраняю..." : "Saving..."}
            </>
          ) : (
            t("save")
          )}
        </button>
      </main>
    </div>
  );
};

export default EntryPage;
