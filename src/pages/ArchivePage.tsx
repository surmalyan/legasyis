import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { getEntriesFromDb, deleteEntryFromDb, chapterLabels, type DiaryEntry } from "@/lib/diary-store";
import { BookOpen, Trash2, ChevronRight, LogOut, Search, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import LanguageToggle from "@/components/LanguageToggle";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

const ArchivePage = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await getEntriesFromDb();
      setEntries(data);
    } catch {
      toast.error(lang === "ru" ? "Ошибка загрузки" : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteEntryFromDb(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch {
      toast.error(lang === "ru" ? "Ошибка удаления" : "Failed to delete");
    }
  };

  const extractTitle = (story: string) => {
    const first = story.split("\n").find(Boolean) || "";
    return first.startsWith("#") ? first.replace(/^#+\s*/, "") : "";
  };

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
      <header className="flex items-center justify-between px-6 pt-14 pb-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground font-serif-display">{t("archive")}</h1>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button onClick={signOut} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <p className="px-6 pb-4 text-sm text-muted-foreground">
        {lang === "ru"
          ? `${entries.length} ${entries.length === 1 ? "запись" : entries.length < 5 ? "записи" : "записей"}`
          : `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
      </p>

      <main className="flex-1 px-6 pb-24">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-accent/50 flex items-center justify-center mb-5">
              <BookOpen size={32} className="text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">{t("noEntries")}</p>
            <p className="text-sm text-muted-foreground mb-6">{t("startWriting")}</p>
            <button onClick={() => navigate("/")} className="bg-primary text-primary-foreground rounded-2xl px-8 py-3 text-base font-medium transition-all active:scale-[0.97]">{t("home")}</button>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {Object.entries(grouped).map(([month, items]) => (
              <section key={month}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium">{month}</span>
                  <span className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-3">
                  {items.map((entry) => {
                    const chapterKey = entry.chapter || "reflections";
                    const chapterLabel = chapterLabels[lang]?.[chapterKey] || chapterKey;
                    return (
                      <button key={entry.id} onClick={() => navigate("/result", { state: { entry } })} className="w-full text-left bg-card rounded-2xl p-5 border border-border shadow-sm transition-all active:scale-[0.98] hover:border-primary/30 group">
                        <div className="flex items-start gap-4">
                          <div className="shrink-0 w-12 h-12 rounded-xl bg-accent/50 flex flex-col items-center justify-center">
                            <span className="text-lg font-semibold text-foreground leading-none">{new Date(entry.date).getDate()}</span>
                            <span className="text-[10px] uppercase text-muted-foreground leading-tight mt-0.5">{new Date(entry.date).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { month: "short" }).replace(".", "")}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">{chapterLabel}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{entry.question}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-1 self-center">
                            <span role="button" onClick={(e) => handleDelete(entry.id, e)} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></span>
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
