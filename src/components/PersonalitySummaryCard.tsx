import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, X, Heart, Star, Eye, Compass } from "lucide-react";
import { toast } from "sonner";

type PersonalitySummary = {
  core_traits: string[];
  values: string[];
  emotional_patterns: string[];
  how_others_saw_them: string[];
  summary: string;
  person_name: string;
};

type Props = {
  circleId: string;
  personName: string;
  memoriesCount: number;
  lang: string;
};

const SECTIONS = (lang: string) => [
  {
    key: "core_traits" as const,
    icon: Star,
    title: lang === "ru" ? "Ключевые черты" : "Core Traits",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    key: "values" as const,
    icon: Compass,
    title: lang === "ru" ? "Ценности" : "Values",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    key: "emotional_patterns" as const,
    icon: Heart,
    title: lang === "ru" ? "Эмоциональные паттерны" : "Emotional Patterns",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    key: "how_others_saw_them" as const,
    icon: Eye,
    title: lang === "ru" ? "Глазами близких" : "How Others Perceived Them",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
];

const PersonalitySummaryCard = ({ circleId, personName, memoriesCount, lang }: Props) => {
  const [summary, setSummary] = useState<PersonalitySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAnalyze = async () => {
    if (memoriesCount < 3) {
      toast.error(
        lang === "ru"
          ? "Нужно минимум 3 воспоминания для анализа"
          : "At least 3 memories are needed for analysis"
      );
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-personality", {
        body: { circle_id: circleId, lang },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setSummary(data as PersonalitySummary);
      setExpanded(true);
    } catch (e: any) {
      console.error("Analysis error:", e);
      toast.error(lang === "ru" ? "Ошибка анализа" : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const sections = SECTIONS(lang);

  // Not yet generated
  if (!summary && !expanded) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {lang === "ru" ? "AI-портрет личности" : "AI Personality Portrait"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === "ru"
                ? "Анализ воспоминаний для создания портрета"
                : "Analyze memories to create a portrait"}
            </p>
          </div>
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={loading || memoriesCount < 3}
          className="w-full rounded-2xl"
          variant={memoriesCount < 3 ? "secondary" : "default"}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              {lang === "ru" ? "Анализируем..." : "Analyzing..."}
            </>
          ) : (
            <>
              <Sparkles size={16} className="mr-2" />
              {lang === "ru" ? "Создать портрет" : "Generate Portrait"}
            </>
          )}
        </Button>

        {memoriesCount < 3 && (
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            {lang === "ru"
              ? `Нужно ещё ${3 - memoriesCount} воспоминаний`
              : `Need ${3 - memoriesCount} more memories`}
          </p>
        )}
      </div>
    );
  }

  // Summary display
  if (!summary) return null;

  return (
    <div className="mb-6 animate-fade-in">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {lang === "ru" ? "Портрет личности" : "Personality Portrait"}
            </h3>
          </div>
          <button
            onClick={() => { setExpanded(false); setSummary(null); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Summary paragraph */}
        <p className="text-sm text-foreground leading-relaxed font-serif-display font-light italic mb-4">
          "{summary.summary}"
        </p>

        {/* Disclaimer */}
        <div className="bg-accent/50 rounded-xl px-4 py-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {lang === "ru"
              ? "⚘ Это отражение основано на воспоминаниях людей, которые знали этого человека. Оно не претендует на полноту и создано с уважением к памяти."
              : "⚘ This reflection is based on shared memories from people who knew them. It does not claim to be complete and was created with respect for their memory."}
          </p>
        </div>
      </div>

      {/* Trait sections */}
      <div className="space-y-3">
        {sections.map(({ key, icon: Icon, title, color, bg }) => (
          <div key={key} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">{title}</h4>
            </div>
            <div className="space-y-2">
              {(summary[key] as string[]).map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`text-xs mt-0.5 ${color}`}>•</span>
                  <p className="text-sm text-foreground leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Regenerate */}
      <Button
        onClick={handleAnalyze}
        disabled={loading}
        variant="ghost"
        className="w-full mt-3 text-muted-foreground"
      >
        {loading ? (
          <Loader2 size={14} className="mr-2 animate-spin" />
        ) : (
          <Sparkles size={14} className="mr-2" />
        )}
        {lang === "ru" ? "Обновить анализ" : "Regenerate analysis"}
      </Button>
    </div>
  );
};

export default PersonalitySummaryCard;
