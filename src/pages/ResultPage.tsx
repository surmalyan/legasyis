import { useNavigate, useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft, Share2, Home, Archive } from "lucide-react";
import { toast } from "sonner";
import InfinitySymbol from "@/components/InfinitySymbol";
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

  const paragraphs = entry.story.split("\n").filter(Boolean);
  const firstLine = paragraphs[0] || "";
  const hasTitle = firstLine.startsWith("#");
  const title = hasTitle ? firstLine.replace(/^#+\s*/, "") : "";
  const bodyParagraphs = hasTitle ? paragraphs.slice(1) : paragraphs;

  const handleShare = async () => {
    const text = `${title ? title + "\n\n" : ""}${bodyParagraphs.join("\n\n")}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: title || t("generatedStory"), text });
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
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6 text-center">
          {formattedDate}
        </p>

        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="h-px w-12 bg-border" />
          <InfinitySymbol size={32} className="text-primary" />
          <span className="h-px w-12 bg-border" />
        </div>

        {title && (
          <h1 className="text-2xl font-serif-display font-semibold text-foreground text-center leading-snug mb-8 px-2">
            {title}
          </h1>
        )}

        <div className="max-w-lg mx-auto space-y-5">
          {bodyParagraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-[1.125rem] leading-[1.85] text-foreground font-light tracking-wide"
              style={{ textIndent: i > 0 ? "1.5em" : undefined }}
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="flex justify-center mt-10 mb-8">
          <span className="text-primary text-2xl select-none">✦</span>
        </div>

        <div className="max-w-lg mx-auto bg-accent/40 rounded-2xl p-5 mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            {t("questionOfTheDay")}
          </p>
          <p className="text-sm text-accent-foreground leading-relaxed">{entry.question}</p>
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
