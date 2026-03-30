import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { chapterLabels, chapterOrder } from "@/lib/questions";
import { Loader2, BookOpen, User, MapPin, Briefcase, Heart, Star, Sparkles, Calendar, ChevronLeft, MessageCircle } from "lucide-react";

interface ProfileData {
  full_name: string | null;
  birth_date: string | null;
  city: string | null;
  avatar_url: string | null;
  occupation: string | null;
  family: string | null;
  hobbies: string | null;
  life_motto: string | null;
  biggest_dream: string | null;
  advice_to_descendants: string | null;
  grateful_for: string | null;
  would_change: string | null;
}

interface Entry {
  id: string;
  question: string;
  original_text: string;
  chapter: string | null;
  created_at: string;
}

const LegacyPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openChapter, setOpenChapter] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      const [profileRes, entriesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, birth_date, city, avatar_url, occupation, family, hobbies, life_motto, biggest_dream, advice_to_descendants, grateful_for, would_change, is_public")
          .eq("user_id", userId)
          .eq("is_public", true)
          .maybeSingle(),
        supabase
          .from("entries")
          .select("id, question, original_text, chapter, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
      ]);

      if (!profileRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileRes.data);
      setEntries(entriesRes.data || []);
      setLoading(false);
    };

    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <User size={48} className="text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold text-foreground font-serif-display mb-2">
          {lang === "ru" ? "Профиль не найден" : "Profile not found"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {lang === "ru"
            ? "Этот профиль не существует или не является публичным"
            : "This profile doesn't exist or is not public"}
        </p>
        <button onClick={() => navigate("/")} className="text-primary text-sm font-medium hover:underline">
          {lang === "ru" ? "На главную" : "Go home"}
        </button>
      </div>
    );
  }

  // Group entries by chapter
  const entriesByChapter: Record<string, Entry[]> = {};
  entries.forEach((e) => {
    const ch = e.chapter || "reflections";
    if (!entriesByChapter[ch]) entriesByChapter[ch] = [];
    entriesByChapter[ch].push(e);
  });

  const chaptersWithEntries = chapterOrder.filter((ch) => entriesByChapter[ch]?.length);
  const labels = chapterLabels[lang] || chapterLabels.en;

  const avatarUrl = profile.avatar_url
    ? supabase.storage.from("avatars").getPublicUrl(profile.avatar_url).data.publicUrl
    : null;

  const profileFields = [
    { icon: MapPin, label: lang === "ru" ? "Город" : "City", value: profile.city },
    { icon: Briefcase, label: lang === "ru" ? "Занятие" : "Occupation", value: profile.occupation },
    { icon: Heart, label: lang === "ru" ? "Семья" : "Family", value: profile.family },
    { icon: Star, label: lang === "ru" ? "Увлечения" : "Hobbies", value: profile.hobbies },
    { icon: Sparkles, label: lang === "ru" ? "Жизненное кредо" : "Life motto", value: profile.life_motto },
    { icon: Star, label: lang === "ru" ? "Главная мечта" : "Biggest dream", value: profile.biggest_dream },
    { icon: Heart, label: lang === "ru" ? "Благодарен за" : "Grateful for", value: profile.grateful_for },
    { icon: MessageCircle, label: lang === "ru" ? "Совет потомкам" : "Advice to descendants", value: profile.advice_to_descendants },
  ].filter((f) => f.value);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-primary/10 to-background px-6 pt-14 pb-8">
        <button onClick={() => navigate(-1)} className="absolute top-14 left-6 text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>

        <div className="flex flex-col items-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg mb-4" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-lg mb-4">
              <User size={36} className="text-primary" />
            </div>
          )}
          <h1 className="text-2xl font-semibold text-foreground font-serif-display text-center">
            {profile.full_name || (lang === "ru" ? "Без имени" : "No name")}
          </h1>
          {profile.birth_date && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar size={14} />
              {new Date(profile.birth_date).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          )}
          {profile.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin size={14} /> {profile.city}
            </p>
          )}
        </div>
      </div>

      <main className="px-6 pb-12 max-w-lg mx-auto">
        {/* About section */}
        {profileFields.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground font-serif-display mb-4">
              {lang === "ru" ? "О человеке" : "About"}
            </h2>
            <div className="space-y-3">
              {profileFields.map((f, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
                  <f.icon size={18} className="text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                    <p className="text-sm text-foreground">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stories by chapter */}
        {chaptersWithEntries.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground font-serif-display mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-primary" />
              {lang === "ru" ? "Истории жизни" : "Life Stories"}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              {lang === "ru"
                ? `${entries.length} записей в ${chaptersWithEntries.length} главах`
                : `${entries.length} entries across ${chaptersWithEntries.length} chapters`}
            </p>

            <div className="space-y-2">
              {chaptersWithEntries.map((ch) => {
                const isOpen = openChapter === ch;
                const chEntries = entriesByChapter[ch];
                return (
                  <div key={ch} className="bg-card border border-border rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setOpenChapter(isOpen ? null : ch)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {chEntries.length}
                        </span>
                        <span className="text-sm font-medium text-foreground">{labels[ch] || ch}</span>
                      </div>
                      <ChevronLeft size={16} className={`text-muted-foreground transition-transform ${isOpen ? "-rotate-90" : "rotate-180"}`} />
                    </button>

                    {isOpen && (
                      <div className="border-t border-border px-4 pb-4 space-y-4">
                        {chEntries.map((entry) => (
                          <div key={entry.id} className="pt-4">
                            <p className="text-xs text-muted-foreground mb-1">
                              {new Date(entry.created_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
                                year: "numeric", month: "long", day: "numeric",
                              })}
                            </p>
                            <p className="text-sm font-medium text-foreground mb-2 font-serif-display">{entry.question}</p>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{entry.original_text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {chaptersWithEntries.length === 0 && profileFields.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">
              {lang === "ru" ? "Пока нет записей" : "No entries yet"}
            </p>
          </div>
        )}

        {/* Branding */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">Legacy</p>
        </div>
      </main>
    </div>
  );
};

export default LegacyPage;
