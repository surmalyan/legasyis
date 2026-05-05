import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Send, X, Image as ImageIcon, Mic, Square, Trash2, Loader2 } from "lucide-react";
import {
  MEMORIAL_QUESTIONS,
  MEMORIAL_CATEGORIES,
  type MemorialCategory,
  type MemorialQuestion,
} from "@/lib/memorial-questions";
import { LIFE_PERIODS, type LifePeriod, getYearRange } from "@/lib/life-periods";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

type Props = {
  lang: string;
  personName: string;
  personBirthYear?: number | null;
  initialCategory?: MemorialCategory | null;
  onSubmit: (
    question: string,
    answer: string,
    extras: {
      category: MemorialCategory;
      photoUrls: string[];
      voicePath: string | null;
      title: string | null;
      lifePeriod: LifePeriod | null;
    }
  ) => Promise<void>;
  onClose: () => void;
};

const GuidedQuestionsFlow = ({ lang, personName, personBirthYear, initialCategory, onSubmit, onClose }: Props) => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<"categories" | "questions">(initialCategory ? "questions" : "categories");
  const [selectedCategory, setSelectedCategory] = useState<MemorialCategory | null>(initialCategory ?? null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [title, setTitle] = useState("");
  const [lifePeriod, setLifePeriod] = useState<LifePeriod | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [voicePath, setVoicePath] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const categories = MEMORIAL_CATEGORIES[lang] || MEMORIAL_CATEGORIES.en;
  const categoryQuestions = selectedCategory
    ? MEMORIAL_QUESTIONS.filter((q) => q.category === selectedCategory)
    : [];
  const currentQ = categoryQuestions[currentIndex];

  const resetExtras = () => {
    setPhotoUrls([]);
    setVoicePath(null);
    setTitle("");
    setLifePeriod("");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    setUploadingPhoto(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(lang === "ru" ? "Файл больше 10 МБ" : "File over 10 MB");
          continue;
        }
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("memory-photos").upload(path, file, {
          contentType: file.type,
        });
        if (error) {
          toast.error(lang === "ru" ? "Ошибка загрузки фото" : "Photo upload failed");
          continue;
        }
        const { data } = supabase.storage.from("memory-photos").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setPhotoUrls((prev) => [...prev, ...uploaded]);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (ev) => audioChunksRef.current.push(ev.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (!user) return;
        setUploadingVoice(true);
        const path = `${user.id}/circle-${Date.now()}.webm`;
        const { error } = await supabase.storage.from("voice-notes").upload(path, blob, {
          contentType: "audio/webm",
        });
        setUploadingVoice(false);
        if (error) {
          toast.error(lang === "ru" ? "Ошибка загрузки голоса" : "Voice upload failed");
          return;
        }
        setVoicePath(path);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      toast.error(lang === "ru" ? "Нет доступа к микрофону" : "Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleSelectCategory = (cat: MemorialCategory) => {
    setSelectedCategory(cat);
    setCurrentIndex(0);
    setAnswer("");
    resetExtras();
    setPhase("questions");
  };

  const handleSubmitAnswer = async () => {
    if (!currentQ) return;
    if (!answer.trim() && photoUrls.length === 0 && !voicePath) return;
    setSubmitting(true);
    const questionText = currentQ.text[lang as "ru" | "en"] || currentQ.text.en;
    await onSubmit(questionText, answer.trim(), {
      category: currentQ.category,
      photoUrls,
      voicePath,
      title: title.trim() || null,
      lifePeriod: (lifePeriod || null) as LifePeriod | null,
    });
    setAnswered((prev) => new Set(prev).add(currentQ.id));
    setAnswer("");
    resetExtras();
    // Auto-advance to next unanswered
    const nextIdx = categoryQuestions.findIndex(
      (q, i) => i > currentIndex && !answered.has(q.id)
    );
    if (nextIdx >= 0) {
      setCurrentIndex(nextIdx);
    } else {
      // All done in category — go back
      setPhase("categories");
      setSelectedCategory(null);
    }
    setSubmitting(false);
  };

  const handleSkip = () => {
    resetExtras();
    setAnswer("");
    if (currentIndex < categoryQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setPhase("categories");
      setSelectedCategory(null);
    }
  };

  // Fullscreen category picker
  if (phase === "categories") {
    const allCats = Object.entries(categories) as [MemorialCategory, { label: string; emoji: string }][];
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-14 pb-4">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
          <p className="text-xs text-muted-foreground font-medium">
            {lang === "ru" ? "Вопросы о" : "Questions about"} {personName}
          </p>
          <div className="w-6" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h2 className="text-xl font-serif-display font-light text-foreground text-center mb-2">
            {lang === "ru" ? "Выберите тему" : "Choose a topic"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-10 max-w-xs">
            {lang === "ru"
              ? "Мы зададим несколько вопросов, чтобы помочь вспомнить важное"
              : "We'll ask a few questions to help you recall what matters"}
          </p>

          <div className="w-full max-w-sm space-y-3">
            {allCats.map(([key, { label, emoji }]) => {
              const questionsInCat = MEMORIAL_QUESTIONS.filter((q) => q.category === key);
              const answeredInCat = questionsInCat.filter((q) => answered.has(q.id)).length;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectCategory(key)}
                  className="w-full flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 text-left hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.98]"
                >
                  <span className="text-2xl">{emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {answeredInCat}/{questionsInCat.length} {lang === "ru" ? "ответов" : "answered"}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen single question
  if (!currentQ) return null;

  const questionText = currentQ.text[lang as "ru" | "en"] || currentQ.text.en;
  const catInfo = categories[selectedCategory!];
  const progress = `${currentIndex + 1}/${categoryQuestions.length}`;
  const isAnswered = answered.has(currentQ.id);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-14 pb-2">
        <button onClick={() => { setPhase("categories"); setSelectedCategory(null); setAnswer(""); }}
          className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">
            {catInfo.emoji} {catInfo.label}
          </p>
          <p className="text-[11px] text-muted-foreground">{progress}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={20} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-4">
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / categoryQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col px-6">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[1.5rem] leading-[1.4] font-serif-display font-light text-foreground text-center max-w-sm">
            {questionText}
          </p>
        </div>

        {/* Answer area */}
        <div className="pb-8 space-y-3">
          {isAnswered ? (
            <div className="text-center py-4">
              <span className="text-sm text-primary font-medium">
                ✓ {lang === "ru" ? "Ответ сохранён" : "Answer saved"}
              </span>
            </div>
          ) : (
            <>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={lang === "ru" ? "Ваш ответ..." : "Your answer..."}
                className="rounded-2xl min-h-[120px] text-base resize-none border-border focus:border-primary"
                autoFocus
              />

              {/* Title */}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang === "ru" ? "Название истории (необязательно)" : "Story title (optional)"}
                className="rounded-2xl text-sm border-border focus:border-primary"
                maxLength={80}
              />

              {/* Life period */}
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
                  {lang === "ru" ? "Период жизни" : "Life period"}
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                  {LIFE_PERIODS.filter((p) => p.key !== "unknown").map((p) => {
                    const yr = getYearRange(p, personBirthYear);
                    const active = lifePeriod === p.key;
                    return (
                      <button
                        key={p.key}
                        onClick={() => setLifePeriod(active ? "" : p.key)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:border-primary/40"
                        }`}
                        title={yr || p.description[lang as "ru" | "en"]}
                      >
                        <span>{p.emoji}</span>
                        <span>{p.label[lang as "ru" | "en"]}</span>
                        {yr && <span className="opacity-70">· {yr}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photo previews */}
              {photoUrls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img src={url} alt="" className="w-16 h-16 rounded-xl object-cover border border-border" />
                      <button
                        onClick={() => setPhotoUrls((p) => p.filter((_, idx) => idx !== i))}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Voice indicator */}
              {voicePath && (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                  <span className="text-xs text-primary flex items-center gap-2">
                    <Mic size={12} /> {lang === "ru" ? "Голос записан" : "Voice recorded"}
                  </span>
                  <button onClick={() => setVoicePath(null)} className="text-muted-foreground hover:text-foreground">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {/* Media controls */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="flex-1 rounded-xl"
                >
                  {uploadingPhoto ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                  <span className="ml-1.5 text-xs">
                    {lang === "ru" ? "Фото" : "Photo"}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant={recording ? "destructive" : "outline"}
                  size="sm"
                  onClick={recording ? stopRecording : startRecording}
                  disabled={uploadingVoice}
                  className="flex-1 rounded-xl"
                >
                  {uploadingVoice ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : recording ? (
                    <Square size={14} />
                  ) : (
                    <Mic size={14} />
                  )}
                  <span className="ml-1.5 text-xs">
                    {recording
                      ? (lang === "ru" ? "Стоп" : "Stop")
                      : (lang === "ru" ? "Голос" : "Voice")}
                  </span>
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={(!answer.trim() && photoUrls.length === 0 && !voicePath) || submitting}
                  className="flex-1 rounded-2xl py-5"
                  size="lg"
                >
                  <Send size={16} className="mr-2" />
                  {lang === "ru" ? "Сохранить" : "Save"}
                </Button>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setAnswer(""); }}
              disabled={currentIndex === 0}
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 py-2 px-3"
            >
              ← {lang === "ru" ? "Назад" : "Back"}
            </button>
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground py-2 px-3"
            >
              {currentIndex < categoryQuestions.length - 1
                ? (lang === "ru" ? "Пропустить →" : "Skip →")
                : (lang === "ru" ? "Завершить" : "Finish")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedQuestionsFlow;
