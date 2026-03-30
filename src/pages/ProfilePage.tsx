import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Check, Loader2, User, Edit3, MapPin, Briefcase, Heart, Star, MessageCircle, Sparkles, Calendar, Share2, Globe, Link2 } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import AvatarUpload from "@/components/AvatarUpload";
import VoiceInput from "@/components/VoiceInput";

interface ProfileData {
  full_name: string;
  birth_date: string;
  city: string;
  avatar_url: string;
  occupation: string;
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
  full_name: "", birth_date: "", city: "", avatar_url: "",
  occupation: "", family: "", hobbies: "", life_motto: "",
  biggest_dream: "", advice_to_descendants: "", grateful_for: "",
  would_change: "", completion_step: 0, is_public: false,
};

type FieldKey = keyof Omit<ProfileData, "completion_step" | "avatar_url" | "is_public">;

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
    occupation: { label: lang === "ru" ? "Род деятельности" : "Occupation", icon: Briefcase },
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
          occupation: data.occupation || "", family: data.family || "",
          hobbies: data.hobbies || "", life_motto: data.life_motto || "",
          biggest_dream: data.biggest_dream || "", advice_to_descendants: data.advice_to_descendants || "",
          grateful_for: data.grateful_for || "", would_change: data.would_change || "",
          completion_step: data.completion_step || 0,
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
      { title: t.medium, keys: ["occupation", "family", "hobbies"] as FieldKey[] },
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
            {(profile.city || profile.occupation) && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                {profile.city && <><MapPin size={12} /> {profile.city}</>}
                {profile.city && profile.occupation && <span>·</span>}
                {profile.occupation && profile.occupation}
              </p>
            )}
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
