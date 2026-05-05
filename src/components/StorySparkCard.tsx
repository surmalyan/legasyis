import { useState, useRef } from "react";
import { Sparkles, RefreshCw, Send, Image as ImageIcon, Mic, Square, Loader2, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SPARK_MOODS, STORY_SPARKS, pickRandomSpark, type SparkMood } from "@/lib/story-sparks";
import type { MemorialCategory } from "@/lib/memorial-questions";
import { LIFE_PERIODS, type LifePeriod, getYearRange } from "@/lib/life-periods";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const MOOD_TO_CATEGORY: Record<SparkMood, MemorialCategory> = {
  funny: "memories",
  unusual: "personality",
  kind: "emotions",
  vivid: "memories",
};

type Props = {
  lang: string;
  personName: string;
  personBirthYear?: number | null;
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
};

const StorySparkCard = ({ lang, personName, personBirthYear, onSubmit }: Props) => {
  const { user } = useAuth();
  const [mood, setMood] = useState<SparkMood | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [seenIdx, setSeenIdx] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [title, setTitle] = useState("");
  const [lifePeriod, setLifePeriod] = useState<LifePeriod | "">("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [voicePath, setVoicePath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const pickPrompt = (m: SparkMood) => {
    const list = STORY_SPARKS[m];
    const idx = Math.floor(Math.random() * list.length);
    setSeenIdx(idx);
    setPrompt(list[idx][lang as "ru" | "en"] || list[idx].en);
  };

  const selectMood = (m: SparkMood) => {
    setMood(m);
    pickPrompt(m);
    setOpen(false);
    setAnswer("");
    setTitle("");
    setLifePeriod("");
    setPhotoUrls([]);
    setVoicePath(null);
  };

  const reroll = () => {
    if (mood) pickPrompt(mood);
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
        const path = `${user.id}/spark-${Date.now()}.webm`;
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

  const handleSave = async () => {
    if (!mood || !prompt) return;
    if (!answer.trim() && photoUrls.length === 0 && !voicePath) return;
    setSubmitting(true);
    await onSubmit(prompt, answer.trim(), {
      category: MOOD_TO_CATEGORY[mood],
      photoUrls,
      voicePath,
      title: title.trim() || null,
      lifePeriod: (lifePeriod || null) as LifePeriod | null,
    });
    setSubmitting(false);
    setMood(null);
    setPrompt("");
    setAnswer("");
    setTitle("");
    setLifePeriod("");
    setPhotoUrls([]);
    setVoicePath(null);
    setOpen(false);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-primary" />
        <h3 className="text-sm font-serif-display text-foreground">
          {lang === "ru" ? "Вспомните историю" : "Recall a story"}
        </h3>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
        {lang === "ru"
          ? `Выберите настроение — мы подскажем вопрос, чтобы вспомнить историю про ${personName}`
          : `Pick a mood — we'll suggest a question to help you recall a story about ${personName}`}
      </p>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {(Object.keys(SPARK_MOODS) as SparkMood[]).map((m) => {
          const info = SPARK_MOODS[m];
          const active = mood === m;
          return (
            <button
              key={m}
              onClick={() => selectMood(m)}
              className={`flex flex-col items-center gap-1 px-1 py-2 rounded-xl border text-[10px] font-medium transition-all active:scale-95 ${
                active
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-background border-border text-foreground hover:border-primary/40"
              }`}
            >
              <span className="text-lg leading-none">{info.emoji}</span>
              <span>{info.label[lang as "ru" | "en"]}</span>
            </button>
          );
        })}
      </div>

      {mood && prompt && (
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 mb-3 animate-fade-in">
          <p className="text-sm font-serif-display text-foreground leading-snug mb-2">
            "{prompt}"
          </p>
          <div className="flex gap-2">
            <button
              onClick={reroll}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <RefreshCw size={11} />
              {lang === "ru" ? "Другой вопрос" : "Another question"}
            </button>
            {!open && (
              <button
                onClick={() => setOpen(true)}
                className="ml-auto text-[11px] text-primary font-medium hover:underline"
              >
                {lang === "ru" ? "Рассказать →" : "Share →"}
              </button>
            )}
          </div>
        </div>
      )}

      {open && mood && (
        <div className="space-y-2 animate-fade-in">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={lang === "ru" ? "Расскажите историю..." : "Share the story..."}
            className="rounded-2xl min-h-[100px] text-sm resize-none border-border focus:border-primary"
            autoFocus
          />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={lang === "ru" ? "Название (необязательно)" : "Title (optional)"}
            className="rounded-2xl text-sm border-border focus:border-primary"
            maxLength={80}
          />

          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {LIFE_PERIODS.filter((p) => p.key !== "unknown").map((p) => {
              const yr = getYearRange(p, personBirthYear);
              const active = lifePeriod === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setLifePeriod(active ? "" : p.key)}
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  <span>{p.emoji}</span>
                  <span>{p.label[lang as "ru" | "en"]}</span>
                  {yr && <span className="opacity-70">· {yr}</span>}
                </button>
              );
            })}
          </div>

          {photoUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photoUrls.map((url, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={url} alt="" className="w-14 h-14 rounded-xl object-cover border border-border" />
                  <button
                    onClick={() => setPhotoUrls((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center"
                  >
                    <X size={8} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {voicePath && (
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-3 py-1.5">
              <span className="text-[11px] text-primary flex items-center gap-1.5">
                <Mic size={11} /> {lang === "ru" ? "Голос записан" : "Voice recorded"}
              </span>
              <button onClick={() => setVoicePath(null)} className="text-muted-foreground hover:text-foreground">
                <Trash2 size={12} />
              </button>
            </div>
          )}

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
              className="flex-1 rounded-xl h-9"
            >
              {uploadingPhoto ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
              <span className="ml-1 text-[11px]">{lang === "ru" ? "Фото" : "Photo"}</span>
            </Button>
            <Button
              type="button"
              variant={recording ? "destructive" : "outline"}
              size="sm"
              onClick={recording ? stopRecording : startRecording}
              disabled={uploadingVoice}
              className="flex-1 rounded-xl h-9"
            >
              {uploadingVoice ? (
                <Loader2 size={12} className="animate-spin" />
              ) : recording ? (
                <Square size={12} />
              ) : (
                <Mic size={12} />
              )}
              <span className="ml-1 text-[11px]">
                {recording ? (lang === "ru" ? "Стоп" : "Stop") : (lang === "ru" ? "Голос" : "Voice")}
              </span>
            </Button>
          </div>

          <Button
            onClick={handleSave}
            disabled={(!answer.trim() && photoUrls.length === 0 && !voicePath) || submitting}
            className="w-full rounded-2xl"
            size="sm"
          >
            {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />}
            {lang === "ru" ? "Сохранить историю" : "Save story"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StorySparkCard;