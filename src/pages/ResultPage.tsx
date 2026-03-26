import { useNavigate, useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft, Share2, Home, Archive } from "lucide-react";
import { toast } from "sonner";
import InfinitySymbol from "@/components/InfinitySymbol";
import { chapterLabels } from "@/lib/diary-store";
import type { DiaryEntry } from "@/lib/diary-store";

const ResultPage = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const entry = (location.state as any)?.entry as DiaryEntry | undefined;

  if (!entry) {
    navigate("/");
    return null;
  }

  const paragraphs = entry.answer.split("\n").filter(Boolean);
  const chapter = entry.chapter || "reflections";
  const chapterLabel = chapterLabels[lang]?.[chapter] || chapterLabels["ru"][chapter] || chapter;

  const handleShare = async () => {
    const text = paragraphs.join("\n\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: entry.question, text });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success(lang === "ru" ? "Скопировано в буфер обмена" : "Copied to clipboard");
    } catch {
      toast.error(lang === "ru" ? "Не удалось скопировать" : "Could not copy");
    }
  };

  const formattedDate = new Date(entry.date).toLocaleDateString(
    lang === "ru" ? "ru-RU" : "en-US",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-6 pt-14 pb-2">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-xl text-foreground hover:bg-secondary transition-colors">
          <ArrowLeft size={24} />
        </button>
        <button onClick={handleShare} className="p-2 -mr-2 rounded-xl text-foreground hover:bg-secondary transition-colors">
          <Share2 size={20} />
        </button>
      </header>

      <main className="flex-1 px-8 pb-8 animate-fade-in">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 text-center">
          {formattedDate}
        </p>

        {/* Chapter badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {lang === "ru" ? "Глава" : "Chapter"}: {chapterLabel}
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="h-px w-12 bg-border" />
          <InfinitySymbol size={32} className="text-primary" />
          <span className="h-px w-12 bg-border" />
        </div>

        {/* Question */}
        <div className="max-w-lg mx-auto bg-accent/40 rounded-2xl p-5 mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {t("questionOfTheDay")}
          </p>
          <p className="text-sm text-accent-foreground leading-relaxed">{entry.question}</p>
        </div>

        {/* Raw answer */}
        <div className="max-w-lg mx-auto space-y-4 mb-10">
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-[1.125rem] leading-[1.85] text-foreground font-light tracking-wide"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="flex justify-center mb-8">
          <InfinitySymbol size={40} className="text-primary" />
        </div>

        <div className="max-w-lg mx-auto flex gap-3">
          <button onClick={() => navigate("/")} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 text-base font-medium transition-all active:scale-[0.97]">
            <Home size={18} />
            {t("home")}
          </button>
          <button onClick={() => navigate("/archive")} className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground rounded-2xl py-4 text-base font-medium transition-all active:scale-[0.97]">
            <Archive size={18} />
            {t("archive")}
          </button>
        </div>

        <div className="max-w-lg mx-auto mt-3">
          <button onClick={handleShare} className="w-full flex items-center justify-center gap-2 border border-border text-foreground rounded-2xl py-4 text-base font-medium transition-all active:scale-[0.97] hover:bg-secondary">
            <Share2 size={18} />
            {t("shareStory")}
          </button>
        </div>
      </main>
    </div>
  );
};

export default ResultPage;
