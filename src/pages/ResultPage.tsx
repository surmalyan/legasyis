import { useNavigate, useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft, BookOpen } from "lucide-react";
import type { DiaryEntry } from "@/lib/diary-store";

const ResultPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const entry = (location.state as any)?.entry as DiaryEntry | undefined;

  if (!entry) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 pt-14 pb-4">
        <button
          onClick={() => navigate("/")}
          className="p-2 -ml-2 rounded-xl text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{t("generatedStory")}</h1>
      </header>

      <main className="flex-1 px-6 pb-8">
        <div className="animate-fade-in">
          {/* Story card */}
          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen size={20} className="text-primary" />
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                {t("story")}
              </span>
            </div>
            <div className="space-y-4">
              {entry.story.split("\n").filter(Boolean).map((paragraph, i) => {
                // First non-empty line is likely the title from AI
                if (i === 0 && paragraph.startsWith("#")) {
                  return (
                    <h2 key={i} className="text-xl font-semibold text-foreground mb-2">
                      {paragraph.replace(/^#+\s*/, "")}
                    </h2>
                  );
                }
                return (
                  <p key={i} className="text-lg leading-relaxed text-foreground font-light">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex-1 bg-primary text-primary-foreground rounded-2xl py-4 text-base font-medium transition-all active:scale-[0.97]"
            >
              {t("home")}
            </button>
            <button
              onClick={() => navigate("/archive")}
              className="flex-1 bg-secondary text-secondary-foreground rounded-2xl py-4 text-base font-medium transition-all active:scale-[0.97]"
            >
              {t("archive")}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultPage;
