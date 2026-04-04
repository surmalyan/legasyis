import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Check, Loader2, User, Edit3, MapPin, Briefcase, Heart, Star, MessageCircle, Sparkles, Calendar, Share2, Globe, Link2, GraduationCap, Languages, Building2 } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import AvatarUpload from "@/components/AvatarUpload";
import VoiceInput from "@/components/VoiceInput";

interface ProfileData {
  full_name: string;
  birth_date: string;
  city: string;
  avatar_url: string;
  username: string;
  occupation: string;
  languages: string;
  education: string;
  employment_sphere: string;
  family: string;
  hobbies: string;
  life_motto: string;
  biggest_dream: string;
  advice_to_descendants: string;
  grateful_for: string;
  would_change: string;
  completion_step: number;
  is_public: boolean;
}

const emptyProfile: ProfileData = {
  full_name: "", birth_date: "", city: "", avatar_url: "", username: "",
  occupation: "", languages: "", education: "", employment_sphere: "",
  family: "", hobbies: "", life_motto: "",
  biggest_dream: "", advice_to_descendants: "", grateful_for: "",
  would_change: "", completion_step: 0, is_public: false,
};

type FieldKey = keyof Omit<ProfileData, "completion_step" | "avatar_url" | "is_public" | "username">;

const ProfilePage = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editingField, setEditingField] = useState<FieldKey | null>(null);

  const t = {
    title: lang === "ru" ? "Моя анкета" : "My Profile",
    surface: lang === "ru" ? "Знакомство" : "Introduction",
    medium: lang === "ru" ? "О себе" : "About Me",
    deep: lang === "ru" ? "Глубже" : "Going Deeper",
    deepest: lang === "ru" ? "Наследие" : "Legacy",
    next: lang === "ru" ? "Далее" : "Next",
    back: lang === "ru" ? "Назад" : "Back",
    save: lang === "ru" ? "Сохранить" : "Save",
    saved: lang === "ru" ? "Сохранено!" : "Saved!",
    error: lang === "ru" ? "Ошибка сохранения" : "Failed to save",
    stepOf: lang === "ru" ? "из" : "of",
    editProfile: lang === "ru" ? "Заполнить заново" : "Fill Again",
    tapToEdit: lang === "ru" ? "Нажмите на поле для редактирования" : "Tap a field to edit",
    notFilled: lang === "ru" ? "Не заполнено" : "Not filled",
  };

  const fieldLabels: Record<FieldKey, { label: string; icon: typeof User }> = {
    full_name: { label: lang === "ru" ? "Имя" : "Name", icon: User },
    birth_date: { label: lang === "ru" ? "Дата рождения" : "Birth Date", icon: Calendar },
    city: { label: lang === "ru" ? "Город" : "City", icon: MapPin },
    languages: { label: lang === "ru" ? "Языки" : "Languages", icon: Languages },
    education: { label: lang === "ru" ? "Образование" : "Education", icon: GraduationCap },
    occupation: { label: lang === "ru" ? "Род деятельности" : "Occupation", icon: Briefcase },
    employment_sphere: { label: lang === "ru" ? "Сфера занятости" : "Employment Sphere", icon: Building2 },
    family: { label: lang === "ru" ? "Семья" : "Family", icon: Heart },
    hobbies: { label: lang === "ru" ? "Увлечения" : "Hobbies", icon: Star },
    life_motto: { label: lang === "ru" ? "Жизненное кредо" : "Life Motto", icon: Sparkles },
    biggest_dream: { label: lang === "ru" ? "Главная мечта" : "Biggest Dream", icon: Star },
    grateful_for: { label: lang === "ru" ? "За что благодарны" : "Grateful For", icon: Heart },
    advice_to_descendants: { label: lang === "ru" ? "Совет потомкам" : "Advice to Descendants", icon: MessageCircle },
    would_change: { label: lang === "ru" ? "Что бы изменили" : "Would Change", icon: Edit3 },
  };

  const steps = [
    {
      title: t.surface,
      subtitle: lang === "ru" ? "Базовая информация о вас" : "Basic information about you",
      hasAvatar: true,
      fields: [
        { key: "full_name" as const, label: lang === "ru" ? "Полное имя" : "Full Name", placeholder: lang === "ru" ? "Как вас зовут?" : "What is your name?", type: "text", voiceable: false },
        { key: "birth_date" as const, label: lang === "ru" ? "Дата рождения" : "Date of Birth", placeholder: "", type: "date", voiceable: false },
        { key: "city" as const, label: lang === "ru" ? "Город" : "City", placeholder: lang === "ru" ? "Где вы живёте?" : "Where do you live?", type: "text", voiceable: false },
      ],
    },
    {
      title: t.medium,
      subtitle: lang === "ru" ? "Расскажите больше о своей жизни" : "Tell more about your life",
      hasAvatar: false,
      fields: [
        { key: "occupation" as const, label: lang === "ru" ? "Род деятельности" : "Occupation", placeholder: lang === "ru" ? "Чем вы занимаетесь?" : "What do you do?", type: "text", voiceable: true },
        { key: "employment_sphere" as const, label: lang === "ru" ? "Сфера занятости" : "Employment Sphere", placeholder: lang === "ru" ? "Выберите или введите" : "Select or type", type: "select", voiceable: false },
        { key: "education" as const, label: lang === "ru" ? "Образование" : "Education", placeholder: lang === "ru" ? "Ваше образование" : "Your education", type: "text", voiceable: true },
        { key: "languages" as const, label: lang === "ru" ? "Языки" : "Languages", placeholder: lang === "ru" ? "Выберите или введите" : "Select or type", type: "multiselect", voiceable: false },
        { key: "family" as const, label: lang === "ru" ? "Семья" : "Family", placeholder: lang === "ru" ? "Расскажите о своей семье" : "Tell about your family", type: "textarea", voiceable: true },
        { key: "hobbies" as const, label: lang === "ru" ? "Увлечения" : "Hobbies", placeholder: lang === "ru" ? "Что вас вдохновляет?" : "What inspires you?", type: "textarea", voiceable: true },
      ],
    },
    {
      title: t.deep,
      subtitle: lang === "ru" ? "Что делает вас — вами?" : "What makes you — you?",
      hasAvatar: false,
      fields: [
        { key: "life_motto" as const, label: lang === "ru" ? "Жизненное кредо" : "Life Motto", placeholder: lang === "ru" ? "Ваш девиз или принцип жизни" : "Your motto or life principle", type: "textarea", voiceable: true },
        { key: "biggest_dream" as const, label: lang === "ru" ? "Главная мечта" : "Biggest Dream", placeholder: lang === "ru" ? "О чём вы мечтаете больше всего?" : "What do you dream about most?", type: "textarea", voiceable: true },
        { key: "grateful_for" as const, label: lang === "ru" ? "За что благодарны" : "Grateful For", placeholder: lang === "ru" ? "За что вы благодарны в жизни?" : "What are you grateful for in life?", type: "textarea", voiceable: true },
      ],
    },
    {
      title: t.deepest,
      subtitle: lang === "ru" ? "Слова для потомков" : "Words for descendants",
      hasAvatar: false,
      fields: [
        { key: "advice_to_descendants" as const, label: lang === "ru" ? "Совет потомкам" : "Advice to Descendants", placeholder: lang === "ru" ? "Что бы вы хотели передать будущим поколениям?" : "What would you like to pass on to future generations?", type: "textarea", voiceable: true },
        { key: "would_change" as const, label: lang === "ru" ? "Что бы изменили" : "What Would You Change", placeholder: lang === "ru" ? "Если бы могли изменить одну вещь в жизни, что бы это было?" : "If you could change one thing in life, what would it be?", type: "textarea", voiceable: true },
      ],
    },
  ];

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setProfile({
          full_name: data.full_name || "", birth_date: data.birth_date || "",
          city: data.city || "", avatar_url: data.avatar_url || "",
          username: (data as any).username || "",
          occupation: data.occupation || "",
          languages: (data as any).languages || "",
          education: (data as any).education || "",
          employment_sphere: (data as any).employment_sphere || "",
          family: data.family || "",
          hobbies: data.hobbies || "", life_motto: data.life_motto || "",
          biggest_dream: data.biggest_dream || "", advice_to_descendants: data.advice_to_descendants || "",
          grateful_for: data.grateful_for || "", would_change: data.would_change || "",
          completion_step: data.completion_step || 0, is_public: (data as any).is_public || false,
        });
        setHasProfile(true);
        // If profile is complete, show view mode
        if ((data.completion_step || 0) >= steps.length) {
          setViewMode(true);
        } else {
          setStep(Math.min(data.completion_step || 0, steps.length - 1));
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleChange = (key: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (nextStep?: number) => {
    if (!user) return;
    setSaving(true);
    try {
      const newStep = nextStep ?? step;
      const payload = {
        ...profile, completion_step: Math.max(profile.completion_step, newStep),
        user_id: user.id, updated_at: new Date().toISOString(),
      };
      if (hasProfile) {
        const { error } = await supabase.from("profiles").update(payload).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profiles").insert(payload);
        if (error) throw error;
        setHasProfile(true);
      }
      setProfile((prev) => ({ ...prev, completion_step: Math.max(prev.completion_step, newStep) }));
      toast.success(t.saved);
    } catch {
      toast.error(t.error);
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await handleSave(step + 1);
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleFinalSave = async () => {
    await handleSave(steps.length);
    setViewMode(true);
  };

  const handleFieldSave = async (key: FieldKey) => {
    setEditingField(null);
    await handleSave(profile.completion_step);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  // ── VIEW MODE: personalized editable profile card ──
  if (viewMode) {
    const profileFields: FieldKey[] = [
      "full_name", "birth_date", "city", "occupation", "family",
      "hobbies", "life_motto", "biggest_dream", "grateful_for",
      "advice_to_descendants", "would_change",
    ];

    const sections = [
      { title: t.surface, keys: ["full_name", "birth_date", "city"] as FieldKey[] },
      { title: t.medium, keys: ["occupation", "employment_sphere", "education", "languages", "family", "hobbies"] as FieldKey[] },
      { title: t.deep, keys: ["life_motto", "biggest_dream", "grateful_for"] as FieldKey[] },
      { title: t.deepest, keys: ["advice_to_descendants", "would_change"] as FieldKey[] },
    ];

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="flex items-center gap-3 px-6 pt-14 pb-4">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold tracking-tight text-foreground font-serif-display flex-1">{t.title}</h1>
          <button onClick={() => { setViewMode(false); setStep(0); }}
            className="text-xs text-primary font-medium hover:underline">
            {t.editProfile}
          </button>
        </header>

        <main className="flex-1 px-6 pb-28 max-w-md mx-auto w-full">
          {/* Profile header card */}
          <div className="flex flex-col items-center mb-8">
            <AvatarUpload
              currentUrl={profile.avatar_url}
              onUploaded={(url) => { handleChange("avatar_url", url); handleSave(profile.completion_step); }}
              lang={lang}
            />
            <h2 className="text-xl font-bold text-foreground mt-3 font-serif-display">
              {profile.full_name || (lang === "ru" ? "Ваше имя" : "Your Name")}
            </h2>
            {profile.username && (
              <p className="text-xs text-primary font-medium mt-0.5">@{profile.username}</p>
            )}
            {!profile.username && (
              <button
                onClick={() => {
                  const un = prompt(lang === "ru" ? "Введите логин (латиницей, без пробелов):" : "Enter username (latin, no spaces):");
                  if (un && /^[a-zA-Z0-9_]{3,30}$/.test(un.trim())) {
                    const val = un.trim().toLowerCase();
                    handleChange("username", val);
                    supabase.from("profiles").update({ username: val } as any).eq("user_id", user!.id)
                      .then(({ error }) => {
                        if (error) {
                          toast.error(lang === "ru" ? "Логин занят" : "Username taken");
                          handleChange("username", "");
                        } else {
                          toast.success(lang === "ru" ? "Логин установлен!" : "Username set!");
                        }
                      });
                  } else if (un) {
                    toast.error(lang === "ru" ? "3-30 символов, латиница и _" : "3-30 chars, latin letters and _");
                  }
                }}
                className="text-xs text-primary/70 hover:text-primary mt-0.5 underline"
              >
                {lang === "ru" ? "Установить логин" : "Set username"}
              </button>
            )}
            {(profile.city || profile.occupation) && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                {profile.city && <><MapPin size={12} /> {profile.city}</>}
                {profile.city && profile.occupation && <span>·</span>}
                {profile.occupation && <span>{profile.occupation}</span>}
              </p>
            )}
          </div>

          {/* Share / Public toggle */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {lang === "ru" ? "Публичный профиль" : "Public Profile"}
                </span>
              </div>
              <button
                onClick={async () => {
                  const newVal = !profile.is_public;
                  setProfile((prev) => ({ ...prev, is_public: newVal }));
                  await supabase.from("profiles").update({ is_public: newVal } as any).eq("user_id", user!.id);
                  toast.success(newVal
                    ? (lang === "ru" ? "Профиль стал публичным" : "Profile is now public")
                    : (lang === "ru" ? "Профиль скрыт" : "Profile is now private"));
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${profile.is_public ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${profile.is_public ? "translate-x-5" : ""}`} />
              </button>
            </div>
            {profile.is_public && (() => {
              const legacyUrl = `${window.location.origin}/legacy/${user!.id}`;
              const shareText = lang === "ru"
                ? `Посмотри моё наследие: ${legacyUrl}`
                : `Check out my legacy: ${legacyUrl}`;
              return (
                <div className="space-y-2">
                  {/* Copy link */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(legacyUrl);
                      toast.success(lang === "ru" ? "Ссылка скопирована!" : "Link copied!");
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary rounded-xl py-2.5 text-sm font-medium hover:bg-primary/15 transition-colors"
                  >
                    <Link2 size={16} />
                    {lang === "ru" ? "Скопировать ссылку" : "Copy link"}
                  </button>

                  {/* Messenger share buttons */}
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </a>
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(legacyUrl)}&text=${encodeURIComponent(lang === "ru" ? "Посмотри моё наследие" : "Check out my legacy")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9]/20"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                      Telegram
                    </a>
                  </div>

                  {/* Native share (mobile) */}
                  {typeof navigator.share === "function" && (
                    <button
                      onClick={() => navigator.share({ title: lang === "ru" ? "Моё наследие" : "My Legacy", url: legacyUrl })}
                      className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground rounded-xl py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                    >
                      <Share2 size={16} />
                      {lang === "ru" ? "Ещё способы" : "More options"}
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Sections */}
          {sections.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
                {section.keys.map((key) => {
                  const meta = fieldLabels[key];
                  const Icon = meta.icon;
                  const value = profile[key] as string;
                  const isEditing = editingField === key;

                  return (
                    <div key={key} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon size={14} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                              {meta.label}
                            </p>
                            <button
                              onClick={() => setEditingField(isEditing ? null : key)}
                              className="p-1 text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                          {isEditing ? (
                            <div className="mt-1.5 space-y-2">
                              {key === "birth_date" ? (
                                <input type="date" value={value}
                                  onChange={(e) => handleChange(key, e.target.value)}
                                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                              ) : ["family", "hobbies", "life_motto", "biggest_dream", "grateful_for", "advice_to_descendants", "would_change"].includes(key) ? (
                                <textarea value={value}
                                  onChange={(e) => handleChange(key, e.target.value)}
                                  rows={3} maxLength={1000} autoFocus
                                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                              ) : (
                                <input type="text" value={value}
                                  onChange={(e) => handleChange(key, e.target.value)}
                                  maxLength={200} autoFocus
                                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                              )}
                              <button onClick={() => handleFieldSave(key)} disabled={saving}
                                className="text-xs bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-medium disabled:opacity-40">
                                {saving ? <Loader2 size={12} className="animate-spin" /> : t.save}
                              </button>
                            </div>
                          ) : (
                            <p className={`text-sm mt-0.5 ${value ? "text-foreground" : "text-muted-foreground italic"}`}>
                              {value || t.notFilled}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </main>
        <BottomNav />
      </div>
    );
  }

  // ── STEP MODE: questionnaire ──
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center gap-3 px-6 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-foreground font-serif-display">{t.title}</h1>
      </header>

      <div className="px-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{step + 1} {t.stepOf} {steps.length}</span>
          <span className="text-xs font-medium text-primary">{currentStep.title}</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <main className="flex-1 px-6 pb-36 max-w-md mx-auto w-full">
        <div className="mt-4 mb-6 animate-fade-in">
          {currentStep.hasAvatar ? (
            <div className="mb-4">
              <AvatarUpload currentUrl={profile.avatar_url} onUploaded={(url) => handleChange("avatar_url", url)} lang={lang} />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <User size={22} className="text-primary" />
            </div>
          )}
          <h2 className="text-xl font-semibold text-foreground font-serif-display mb-1">{currentStep.title}</h2>
          <p className="text-sm text-muted-foreground">{currentStep.subtitle}</p>
        </div>

        <div className="space-y-5">
          {currentStep.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{field.label}</label>
                {field.voiceable && (
                  <VoiceInput fieldKey={field.key}
                    onTranscribed={(text) => {
                      const current = profile[field.key] as string;
                      handleChange(field.key, current ? current + " " + text : text);
                    }} lang={lang} />
                )}
              </div>
              {field.type === "textarea" ? (
                <textarea value={profile[field.key] as string} onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder} rows={3} maxLength={1000}
                  className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow" />
              ) : (
                <input type={field.type} value={profile[field.key] as string} onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder} maxLength={200}
                  className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow" />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={handleBack} className="flex-1 flex items-center justify-center gap-2 bg-muted text-muted-foreground rounded-2xl py-3.5 text-sm font-medium transition-all active:scale-[0.97] hover:bg-accent">
              <ChevronLeft size={18} /> {t.back}
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={handleNext} disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-3.5 text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-40">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <>{t.next}<ChevronRight size={18} /></>}
            </button>
          ) : (
            <button onClick={handleFinalSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-3.5 text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-40">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} />{t.save}</>}
            </button>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default ProfilePage;
