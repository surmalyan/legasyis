import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { chapterOrder, chapterLabels } from "@/lib/questions";
import { BookOpen } from "lucide-react";

const QUESTIONS_PER_CHAPTER = 104;

const chapterIcons: Record<string, string> = {
  childhood: "🧒", family: "👨‍👩‍👧‍👦", relationships: "❤️", career: "💼",
  daily_life: "☀️", travel: "✈️", dreams: "🌙", values: "⚖️",
  gratitude: "🙏", wisdom: "🦉", memories: "📸", reflections: "💭",
};

const ChapterProgress = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("entries")
        .select("chapter")
        .eq("user_id", user.id);
      const map: Record<string, number> = {};
      (data || []).forEach((e) => {
        const ch = e.chapter || "reflections";
        map[ch] = (map[ch] || 0) + 1;
      });
      setCounts(map);
      setLoading(false);
    };
    load();
  }, [user]);

  const totalAnswered = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalQuestions = chapterOrder.length * QUESTIONS_PER_CHAPTER;
  const overallPercent = Math.round((totalAnswered / totalQuestions) * 100);

  if (loading) return null;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BookOpen size={16} className="text-primary" />
          {lang === "ru" ? "Прогресс книги" : "Book Progress"}
        </h3>
        <span className="text-xs text-muted-foreground">
          {totalAnswered}/{totalQuestions} · {overallPercent}%
        </span>
      </div>

      {/* Overall bar */}
      <div className="h-2 w-full rounded-full bg-secondary mb-4 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${overallPercent}%` }}
        />
      </div>

      {/* Chapter grid */}
      <div className="grid grid-cols-3 gap-2">
        {chapterOrder.map((ch) => {
          const count = counts[ch] || 0;
          const pct = Math.round((count / QUESTIONS_PER_CHAPTER) * 100);
          const label = chapterLabels[lang as "ru" | "en"]?.[ch] || ch;

          return (
            <button
              key={ch}
              onClick={() => navigate("/archive")}
              className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all text-center"
            >
              <span className="text-lg">{chapterIcons[ch]}</span>
              <span className="text-[10px] font-medium text-foreground leading-tight line-clamp-1">
                {label}
              </span>
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground">{count}/{QUESTIONS_PER_CHAPTER}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChapterProgress;
