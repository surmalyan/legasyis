import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { getEntries, deleteEntry, type DiaryEntry } from "@/lib/diary-store";
import { BookOpen, Trash2, ChevronRight } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import BottomNav from "@/components/BottomNav";

const ArchivePage = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteEntry(id);
    setEntries(getEntries());
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(
      lang === "ru" ? "ru-RU" : "en-US",
      { day: "numeric", month: "long", year: "numeric" }
    );

  const extractTitle = (story: string) => {
    const first = story.split("\n").find(Boolean) || "";
    return first.startsWith("#") ? first.replace(/^#+\s*/, "") : "";
  };

  // Group entries by month
  const grouped = entries.reduce<Record<string, DiaryEntry[]>>((acc, entry) => {
    const month = new Date(entry.date).toLocaleDateString(
      lang === "ru" ? "ru-RU" : "en-US",
      { month: "long", year: "numeric" }
    );
    (acc[month] ||= []).push(entry);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-14 pb-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("archive")}
        </h1>
        <LanguageToggle />
      </header>

      {/* Subtitle */}
      <p className="px-6 pb-4 text-sm text-muted-foreground">
        {lang === "ru"
          ? `${entries.length} ${entries.length === 1 ? "запись" : entries.length < 5 ? "записи" : "записей"}`
          : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
      </p>

      <main className="flex-1 px-6 pb-24">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-accent/50 flex items-center justify-center mb-5">
              <BookOpen size={32} className="text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">{t("noEntries")}</p>
            <p className="text-sm text-muted-foreground mb-6">{t("startWriting")}</p>
            <button
              onClick={() => navigate("/")}
              className="bg-primary text-primary-foreground rounded-2xl px-8 py-3 text-base font-medium transition-all active:scale-[0.97]"
            >
              {t("home")}
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {Object.entries(grouped).map(([month, items]) => (
              <section key={month}>
                {/* Month header */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">
                    {month}
                  </span>
                  <span className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-3">
                  {items.map((entry) => {
                    const title = extractTitle(entry.story);
                    return (
                      <button
                        key={entry.id}
                        onClick={() => navigate("/result", { state: { entry } })}
                        className="w-full text-left bg-card rounded-2xl p-5 border border-border shadow-sm transition-all active:scale-[0.98] hover:border-primary/30 group"
                      >
                        <div className="flex items-start gap-4">
                          {/* Date pill */}
                          <div className="shrink-0 w-12 h-12 rounded-xl bg-accent/50 flex flex-col items-center justify-center">
                            <span className="text-lg font-semibold text-foreground leading-none">
                              {new Date(entry.date).getDate()}
                            </span>
                            <span className="text-[10px] uppercase text-muted-foreground leading-tight mt-0.5">
                              {new Date(entry.date).toLocaleDateString(
                                lang === "ru" ? "ru-RU" : "en-US",
                                { month: "short" }
                              ).replace(".", "")}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {title && (
                              <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-1">
                                {title}
                              </h3>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {entry.question}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="shrink-0 flex items-center gap-1 self-center">
                            <span
                              role="button"
                              onClick={(e) => handleDelete(entry.id, e)}
                              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                            </span>
                            <ChevronRight size={18} className="text-muted-foreground" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ArchivePage;
