import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import BackgroundPattern from "@/components/BackgroundPattern";
import StaticLogo from "@/components/StaticLogo";
import GuidedQuestionsFlow from "@/components/GuidedQuestionsFlow";
import PersonalitySummaryCard from "@/components/PersonalitySummaryCard";
import PhotoQuestionAssistant from "@/components/PhotoQuestionAssistant";
import StorySparkCard from "@/components/StorySparkCard";
import InviteContributorModal from "@/components/invite/InviteContributorModal";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Plus, Clock, BookOpen, Mic, UserPlus, Bell } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { MEMORIAL_CATEGORIES, MEMORIAL_QUESTIONS, type MemorialCategory } from "@/lib/memorial-questions";
import { LIFE_PERIODS, getPeriodInfo, getYearRange, type LifePeriod } from "@/lib/life-periods";

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
  category: string | null;
  life_year: number | null;
  title: string | null;
  life_period: string | null;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [circle, setCircle] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [reminding, setReminding] = useState<string | null>(null);
  const [showGuided, setShowGuided] = useState(false);
  const [initialTopic, setInitialTopic] = useState<MemorialCategory | null>(null);
  const [view, setView] = useState<"periods" | "chapters" | "timeline">("periods");
  const [voiceUrls, setVoiceUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id && user) loadAll();
  }, [id, user]);

  // Auto-open guided flow when invited with ?topic=
  useEffect(() => {
    const t = searchParams.get("topic") as MemorialCategory | null;
    if (t && MEMORIAL_CATEGORIES[lang]?.[t]) {
      setInitialTopic(t);
      setShowGuided(true);
      // clean URL
      searchParams.delete("topic");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // Sign voice URLs
    const memoriesWithVoice = ((memoriesRes.data as Memory[]) || []).filter((m) => m.voice_note_path);
    if (memoriesWithVoice.length) {
      const urls: Record<string, string> = {};
      await Promise.all(
        memoriesWithVoice.map(async (m) => {
          const { data } = await supabase.storage
            .from("voice-notes")
            .createSignedUrl(m.voice_note_path!, 3600);
          if (data?.signedUrl) urls[m.id] = data.signedUrl;
        })
      );
      setVoiceUrls(urls);
    }
  };

  const sendReminder = async (memberUserId: string) => {
    if (!id) return;
    setReminding(memberUserId);
    const { error } = await supabase.rpc("remind_silent_contributor", {
      _circle_id: id,
      _member_user_id: memberUserId,
    });
    setReminding(null);
    if (error) {
      toast.error(lang === "ru" ? "Не удалось напомнить" : "Could not remind");
    } else {
      toast.success(lang === "ru" ? "Напоминание отправлено" : "Reminder sent");
    }
  };

  const handleGuidedSubmit = async (
    question: string,
    answer: string,
    extras: {
      category: MemorialCategory;
      photoUrls: string[];
      voicePath: string | null;
      title: string | null;
      lifePeriod: LifePeriod | null;
    }
  ) => {
    if (!user || !id) return;
    const { error } = await supabase.from("circle_memories").insert({
      circle_id: id,
      author_id: user.id,
      content: answer,
      question,
      category: extras.category,
      photo_urls: extras.photoUrls.length ? extras.photoUrls : null,
      voice_note_path: extras.voicePath,
      title: extras.title,
      life_period: extras.lifePeriod,
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
  const categories = MEMORIAL_CATEGORIES[lang] || MEMORIAL_CATEGORIES.en;

  // Map memories count per member
  const memoriesByAuthor: Record<string, number> = {};
  memories.forEach((m) => {
    memoriesByAuthor[m.author_id] = (memoriesByAuthor[m.author_id] || 0) + 1;
  });

  const renderMemoryCard = (memory: Memory) => {
    const author = members.find((m) => m.user_id === memory.author_id);
    const period = memory.life_period ? getPeriodInfo(memory.life_period) : null;
    return (
      <div key={memory.id} className="bg-card border border-border rounded-2xl p-4">
        {memory.title && (
          <h4 className="text-base font-serif-display text-foreground mb-1.5">
            {memory.title}
          </h4>
        )}
        {period && (
          <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
            <span>{period.emoji}</span>
            <span>{period.label[lang as "ru" | "en"]}</span>
          </p>
        )}
        {memory.question && (
          <p className="text-xs text-primary font-medium mb-2 italic">{memory.question}</p>
        )}
        {memory.content && (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{memory.content}</p>
        )}
        {memory.photo_urls && memory.photo_urls.length > 0 && (
          <div className={`mt-3 grid gap-2 ${memory.photo_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {memory.photo_urls.map((url, i) => (
              <img key={i} src={url} alt="" className="w-full rounded-xl object-cover max-h-64" />
            ))}
          </div>
        )}
        {memory.voice_note_path && voiceUrls[memory.id] && (
          <div className="mt-3 flex items-center gap-2 bg-primary/5 rounded-xl px-3 py-2">
            <Mic size={14} className="text-primary flex-shrink-0" />
            <audio controls src={voiceUrls[memory.id]} className="flex-1 h-8" />
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium">
              {(author?.display_name || "?").charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-muted-foreground">
              {author?.display_name ||
                (circle.creator_id === memory.author_id
                  ? lang === "ru" ? "Создатель" : "Creator"
                  : lang === "ru" ? "Участник" : "Member")}
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
  };

  // Group memories by category for chapters view
  const memoriesByCategory: Record<string, Memory[]> = {};
  memories.forEach((m) => {
    // derive category from question if not stored (legacy entries)
    let cat = m.category;
    if (!cat && m.question) {
      const q = MEMORIAL_QUESTIONS.find(
        (q) => q.text.ru === m.question || q.text.en === m.question
      );
      cat = q?.category || "memories";
    }
    cat = cat || "memories";
    if (!memoriesByCategory[cat]) memoriesByCategory[cat] = [];
    memoriesByCategory[cat].push(m);
  });

  // Group memories by life period
  const memoriesByPeriod: Record<string, Memory[]> = {};
  memories.forEach((m) => {
    const key = m.life_period || "unknown";
    if (!memoriesByPeriod[key]) memoriesByPeriod[key] = [];
    memoriesByPeriod[key].push(m);
  });

  return (
    <>
      {showGuided && (
        <GuidedQuestionsFlow
          lang={lang}
          personName={circle.person_name}
          personBirthYear={circle.person_birth_year}
          initialCategory={initialTopic}
          onSubmit={handleGuidedSubmit}
          onClose={() => { setShowGuided(false); setInitialTopic(null); }}
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
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-foreground">
                          {(member.display_name || "?").charAt(0).toUpperCase()}
                        </div>
                        {(memoriesByAuthor[member.user_id] || 0) === 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-background" title={lang === "ru" ? "Ещё не ответил" : "Hasn't answered yet"} />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground max-w-[60px] truncate">
                        {member.display_name || (lang === "ru" ? "Участник" : "Member")}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[member.role_label]}`}>
                        {ROLE_LABELS[lang]?.[member.role_label] || member.role_label}
                      </span>
                      {isCreator && (memoriesByAuthor[member.user_id] || 0) === 0 && (
                        <button
                          onClick={() => sendReminder(member.user_id)}
                          disabled={reminding === member.user_id}
                          className="text-[9px] text-primary hover:underline flex items-center gap-0.5 disabled:opacity-50"
                        >
                          <Bell size={9} />
                          {reminding === member.user_id
                            ? (lang === "ru" ? "..." : "...")
                            : (lang === "ru" ? "Напомнить" : "Remind")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invite contributor */}
            {isCreator && (
              <Button onClick={() => setInviteOpen(true)} variant="outline" className="w-full rounded-2xl mb-4 border-primary/30 text-primary hover:bg-primary/5">
                <UserPlus size={16} className="mr-2" />
                {lang === "ru" ? "Пригласить соавтора" : "Invite contributor"}
              </Button>
            )}

            {/* Guided questions CTA */}
            <Button onClick={() => setShowGuided(true)} className="w-full rounded-2xl mb-6" size="lg">
              <Plus size={18} className="mr-2" />
              {lang === "ru" ? "Ответить на вопросы" : "Answer questions"}
            </Button>

            {/* Story Spark — quick mood-based prompt to recall a funny/unusual/kind/vivid story */}
            <StorySparkCard
              lang={lang}
              personName={circle.person_name}
              personBirthYear={circle.person_birth_year}
              onSubmit={handleGuidedSubmit}
            />

            {/* AI Photo Assistant — suggests questions based on uploaded photo */}
            <PhotoQuestionAssistant
              lang={lang}
              personName={circle.person_name}
            />

            {/* AI Personality Summary */}
            <PersonalitySummaryCard
              circleId={id!}
              personName={circle.person_name}
              memoriesCount={memories.length}
              lang={lang}
            />

            {/* Book layout: chapters / timeline switcher */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                {lang === "ru" ? "Книга" : "The Book"} ({memories.length})
              </h3>
              <div className="flex bg-secondary rounded-xl p-1 gap-0.5">
                <button
                  onClick={() => setView("periods")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    view === "periods" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  🕰️ {lang === "ru" ? "Периоды" : "Periods"}
                </button>
                <button
                  onClick={() => setView("chapters")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    view === "chapters" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <BookOpen size={12} />
                  {lang === "ru" ? "Темы" : "Topics"}
                </button>
                <button
                  onClick={() => setView("timeline")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    view === "timeline" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <Clock size={12} />
                  {lang === "ru" ? "Лента" : "Timeline"}
                </button>
              </div>
            </div>

            {memories.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {lang === "ru" ? "Пока нет воспоминаний. Будьте первым!" : "No memories yet. Be the first!"}
              </p>
            ) : view === "periods" ? (
              <div className="space-y-6">
                {LIFE_PERIODS.map((p) => {
                  const periodMems = memoriesByPeriod[p.key] || [];
                  if (periodMems.length === 0) return null;
                  const yr = getYearRange(p, circle.person_birth_year);
                  return (
                    <div key={p.key}>
                      <div className="flex items-baseline gap-2 mb-3 pb-2 border-b border-border">
                        <span className="text-lg">{p.emoji}</span>
                        <h4 className="text-sm font-serif-display text-foreground">
                          {p.label[lang as "ru" | "en"]}
                        </h4>
                        <span className="text-[10px] text-muted-foreground">
                          {yr || p.description[lang as "ru" | "en"]}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {periodMems.length}
                        </span>
                      </div>
                      <div className="space-y-3">{periodMems.map(renderMemoryCard)}</div>
                    </div>
                  );
                })}
              </div>
            ) : view === "chapters" ? (
              <div className="space-y-6">
                {(Object.keys(categories) as MemorialCategory[]).map((catKey) => {
                  const catMems = memoriesByCategory[catKey] || [];
                  if (catMems.length === 0) return null;
                  const catInfo = categories[catKey];
                  return (
                    <div key={catKey}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{catInfo.emoji}</span>
                        <h4 className="text-sm font-serif-display text-foreground">{catInfo.label}</h4>
                        <span className="text-[10px] text-muted-foreground">({catMems.length})</span>
                      </div>
                      <div className="space-y-3">{catMems.map(renderMemoryCard)}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="relative space-y-4 pl-5 border-l-2 border-border">
                {memories
                  .slice()
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((memory) => (
                    <div key={memory.id} className="relative">
                      <div className="absolute -left-[26px] top-3 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      {renderMemoryCard(memory)}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </main>

        {circle && (
          <InviteContributorModal
            open={inviteOpen}
            onClose={() => setInviteOpen(false)}
            inviteCode={circle.invite_code}
            circleId={circle.id}
            personName={circle.person_name}
          />
        )}
      </div>
    </>
  );
};

export default CircleDetailPage;
