import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { getEntries, deleteEntry, type DiaryEntry } from "@/lib/diary-store";
import { BookOpen, Trash2 } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import BottomNav from "@/components/BottomNav";

const ArchivePage = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  const handleDelete = (id: string) => {
    deleteEntry(id);
    setEntries(getEntries());
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      lang === "ru" ? "ru-RU" : "en-US",
      { day: "numeric", month: "long", year: "numeric" }
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-14 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("archive")}
        </h1>
        <LanguageToggle />
      </header>

      <main className="flex-1 px-6 pb-24">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in">
            <BookOpen size={48} className="text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">{t("noEntries")}</p>
            <p className="text-sm text-muted-foreground">{t("startWriting")}</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-card rounded-2xl p-5 border border-border shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium mb-1">
                      {formatDate(entry.date)}
                    </p>
                    <p className="text-base font-medium text-foreground mb-2 line-clamp-1">
                      {entry.question}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {entry.answer}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => navigate("/result", { state: { entry } })}
                      className="p-2.5 rounded-xl bg-accent text-accent-foreground hover:opacity-80 transition-colors"
                    >
                      <BookOpen size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ArchivePage;
