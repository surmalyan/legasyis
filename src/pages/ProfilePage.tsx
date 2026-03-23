import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Check, Loader2, User } from "lucide-react";
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
}

const emptyProfile: ProfileData = {
  full_name: "",
  birth_date: "",
  city: "",
  avatar_url: "",
  occupation: "",
  family: "",
  hobbies: "",
  life_motto: "",
  biggest_dream: "",
  advice_to_descendants: "",
  grateful_for: "",
  would_change: "",
  completion_step: 0,
};

const ProfilePage = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

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
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          birth_date: data.birth_date || "",
          city: data.city || "",
          avatar_url: data.avatar_url || "",
          occupation: data.occupation || "",
          family: data.family || "",
          hobbies: data.hobbies || "",
          life_motto: data.life_motto || "",
          biggest_dream: data.biggest_dream || "",
          advice_to_descendants: data.advice_to_descendants || "",
          grateful_for: data.grateful_for || "",
          would_change: data.would_change || "",
          completion_step: data.completion_step || 0,
        });
        setHasProfile(true);
        setStep(Math.min(data.completion_step || 0, steps.length - 1));
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
        ...profile,
        completion_step: Math.max(profile.completion_step, newStep),
        user_id: user.id,
        updated_at: new Date().toISOString(),
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
    if (step < steps.length - 1) setStep(step + 1);
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center gap-3 px-6 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-foreground font-serif-display">{t.title}</h1>
      </header>

      {/* Progress bar */}
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
              <AvatarUpload
                currentUrl={profile.avatar_url}
                onUploaded={(url) => handleChange("avatar_url", url)}
                lang={lang}
              />
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
                  <VoiceInput
                    fieldKey={field.key}
                    onTranscribed={(text) => {
                      const current = profile[field.key] as string;
                      handleChange(field.key, current ? current + " " + text : text);
                    }}
                    lang={lang}
                  />
                )}
              </div>
              {field.type === "textarea" ? (
                <textarea
                  value={profile[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  maxLength={1000}
                  className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow"
                />
              ) : (
                <input
                  type={field.type}
                  value={profile[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  maxLength={200}
                  className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={handleBack} className="flex-1 flex items-center justify-center gap-2 bg-muted text-muted-foreground rounded-2xl py-3.5 text-sm font-medium transition-all active:scale-[0.97] hover:bg-accent">
              <ChevronLeft size={18} />
              {t.back}
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={handleNext} disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-3.5 text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-40">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <>{t.next}<ChevronRight size={18} /></>}
            </button>
          ) : (
            <button onClick={() => handleSave(steps.length)} disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-3.5 text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-40">
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
