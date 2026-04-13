import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import BackgroundPattern from "@/components/BackgroundPattern";
import StaticLogo from "@/components/StaticLogo";
import GuidedQuestionsFlow from "@/components/GuidedQuestionsFlow";
import PersonalitySummaryCard from "@/components/PersonalitySummaryCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Copy, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type CircleRole = Database["public"]["Enums"]["circle_role"];

type Member = {
  id: string;
  user_id: string;
  display_name: string | null;
  role_label: CircleRole;
  status: string;
};

type Memory = {
  id: string;
  author_id: string;
  content: string | null;
  photo_urls: string[] | null;
  voice_note_path: string | null;
  question: string | null;
  created_at: string;
};

const ROLE_LABELS: Record<string, Record<CircleRole, string>> = {
  ru: { family: "Семья", friend: "Друг", colleague: "Коллега" },
  en: { family: "Family", friend: "Friend", colleague: "Colleague" },
};

const ROLE_COLORS: Record<CircleRole, string> = {
  family: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  friend: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  colleague: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

const CircleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [circle, setCircle] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showGuided, setShowGuided] = useState(false);

  useEffect(() => {
    if (id && user) loadAll();
  }, [id, user]);

  const loadAll = async () => {
    setLoading(true);
    const [circleRes, membersRes, memoriesRes] = await Promise.all([
      supabase.from("memory_circles").select("*").eq("id", id!).single(),
      supabase.from("circle_members").select("*").eq("circle_id", id!),
      supabase.from("circle_memories").select("*").eq("circle_id", id!).order("created_at", { ascending: false }),
    ]);
    setCircle(circleRes.data);
    setMembers((membersRes.data as Member[]) || []);
    setMemories((memoriesRes.data as Memory[]) || []);
    setLoading(false);
  };

  const copyInviteLink = () => {
    if (!circle) return;
    const link = `${window.location.origin}/memory-circle/join/${circle.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(lang === "ru" ? "Ссылка скопирована" : "Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGuidedSubmit = async (question: string, answer: string) => {
    if (!user || !id) return;
    const { error } = await supabase.from("circle_memories").insert({
      circle_id: id,
      author_id: user.id,
      content: answer,
      question,
    });
    if (error) {
      toast.error(lang === "ru" ? "Ошибка сохранения" : "Failed to save");
    } else {
      toast.success(lang === "ru" ? "Сохранено" : "Saved");
      loadAll();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{lang === "ru" ? "Загрузка..." : "Loading..."}</p>
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{lang === "ru" ? "Круг не найден" : "Circle not found"}</p>
      </div>
    );
  }

  const isCreator = circle.creator_id === user?.id;
  const years = [circle.person_birth_year, circle.person_death_year].filter(Boolean).join(" – ");

  return (
    <>
      {showGuided && (
        <GuidedQuestionsFlow
          lang={lang}
          personName={circle.person_name}
          onSubmit={handleGuidedSubmit}
          onClose={() => setShowGuided(false)}
        />
      )}

      <div className="min-h-screen flex flex-col bg-background relative">
        <BackgroundPattern />

        <header className="flex items-center gap-3 px-6 pt-14 pb-4 relative z-10">
          <button onClick={() => navigate("/memory-circle")} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft size={24} />
          </button>
          <StaticLogo size={32} />
        </header>

        <main className="flex-1 px-6 pb-12 relative z-10">
          <div className="max-w-md mx-auto">
            {/* Person profile */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-serif-display text-primary">
                  {circle.person_name.charAt(0)}
                </span>
              </div>
              <h2 className="text-xl font-serif-display font-light text-foreground">{circle.person_name}</h2>
              {years && <p className="text-sm text-muted-foreground mt-1">{years}</p>}
              {circle.description && <p className="text-xs text-muted-foreground mt-2">{circle.description}</p>}
            </div>

            {/* Contributors circle visualization */}
            {members.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3 text-center">
                  {lang === "ru" ? "Участники" : "Contributors"}
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {members.filter(m => m.status === "active").map((member) => (
                    <div key={member.id} className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-foreground">
                        {(member.display_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] text-muted-foreground max-w-[60px] truncate">
                        {member.display_name || (lang === "ru" ? "Участник" : "Member")}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[member.role_label]}`}>
                        {ROLE_LABELS[lang]?.[member.role_label] || member.role_label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invite link */}
            {isCreator && (
              <Button onClick={copyInviteLink} variant="outline" className="w-full rounded-2xl mb-4">
                {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                {lang === "ru" ? "Скопировать ссылку-приглашение" : "Copy invite link"}
              </Button>
            )}

            {/* Guided questions CTA */}
            <Button onClick={() => setShowGuided(true)} className="w-full rounded-2xl mb-6" size="lg">
              <Plus size={18} className="mr-2" />
              {lang === "ru" ? "Ответить на вопросы" : "Answer questions"}
            </Button>

            {/* AI Personality Summary */}
            <PersonalitySummaryCard
              circleId={id!}
              personName={circle.person_name}
              memoriesCount={memories.length}
              lang={lang}
            />

            {/* Memories list */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                {lang === "ru" ? "Воспоминания" : "Memories"} ({memories.length})
              </h3>
              {memories.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {lang === "ru" ? "Пока нет воспоминаний. Будьте первым!" : "No memories yet. Be the first!"}
                </p>
              ) : (
                memories.map((memory) => {
                  const author = members.find(m => m.user_id === memory.author_id);
                  return (
                    <div key={memory.id} className="bg-card border border-border rounded-2xl p-4">
                      {memory.question && (
                        <p className="text-xs text-primary font-medium mb-2 italic">
                          {memory.question}
                        </p>
                      )}
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {memory.content}
                      </p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium">
                            {(author?.display_name || "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {author?.display_name || (circle.creator_id === memory.author_id
                              ? (lang === "ru" ? "Создатель" : "Creator")
                              : (lang === "ru" ? "Участник" : "Member"))}
                          </span>
                          {author && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[author.role_label]}`}>
                              {ROLE_LABELS[lang]?.[author.role_label] || author.role_label}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(memory.created_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CircleDetailPage;
