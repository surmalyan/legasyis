import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import BackgroundPattern from "@/components/BackgroundPattern";
import StaticLogo from "@/components/StaticLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  ChevronLeft,
  Mic,
  Type as TypeIcon,
  Image as ImageIcon,
  Square,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

type Step = "hero" | "choose" | "voice" | "text" | "photo" | "details" | "done";
type Mode = "voice" | "text" | "photo";

const JoinCirclePage = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic");
  const { lang } = useI18n();
  const navigate = useNavigate();

  const [circle, setCircle] = useState<any>(null);
  const [ownerName, setOwnerName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>("hero");
  const [mode, setMode] = useState<Mode | null>(null);

  // contribution drafts
  const [textContent, setTextContent] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoCaption, setPhotoCaption] = useState("");
  const recorder = useAudioRecorder();

  // guest details (collected at the end)
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data: c } = await supabase
        .from("memory_circles")
        .select("id, person_name, person_birth_year, person_death_year, person_photo_url, description, creator_id, invite_code")
        .eq("invite_code", code)
        .maybeSingle();
      setCircle(c);
      if (c?.creator_id) {
        const { data: p } = await supabase
          .from("public_profiles")
          .select("full_name, username")
          .eq("user_id", c.creator_id)
          .maybeSingle();
        setOwnerName(p?.full_name || p?.username || "");
      }
      // Pre-fill text mode if a topic/question was passed
      if (topic) setTextContent("");
      setLoading(false);
    })();
  }, [code, topic]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={28} className="text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <p className="text-muted-foreground mb-4">
          {lang === "ru" ? "Круг не найден" : "Circle not found"}
        </p>
        <Button onClick={() => navigate("/")} variant="outline">
          {lang === "ru" ? "На главную" : "Go home"}
        </Button>
      </div>
    );
  }

  const years = [circle.person_birth_year, circle.person_death_year].filter(Boolean).join(" – ");
  const personName = circle.person_name;
  const ownerLabel = ownerName || (lang === "ru" ? "Близкий человек" : "A loved one");
  const photoUrl = circle.person_photo_url
    ? supabase.storage.from("memory-photos").getPublicUrl(circle.person_photo_url).data.publicUrl
    : null;

  const heartfeltMessage =
    lang === "ru"
      ? `${ownerLabel} собирает Круг Памяти о ${personName}. Каждая история — это часть мозаики, которая хранит его наследие живым.`
      : `${ownerLabel} is gathering a Circle of Memory for ${personName}. Every story is a piece of a puzzle that keeps their legacy alive.`;

  const t = {
    share: lang === "ru" ? "Поделиться воспоминанием" : "Share a Memory",
    chooseHow: lang === "ru" ? "Как вы хотите поделиться?" : "How would you like to share?",
    voice: lang === "ru" ? "Голосом" : "Voice",
    voiceHint: lang === "ru" ? "Запишите рассказ своим голосом" : "Record your story in your own voice",
    text: lang === "ru" ? "Текстом" : "Text",
    textHint: lang === "ru" ? "Напишите воспоминание" : "Write a memory",
    photo: lang === "ru" ? "Фотографией" : "Photo",
    photoHint: lang === "ru" ? "Прикрепите фото и подпись" : "Attach a photo with a caption",
    back: lang === "ru" ? "Назад" : "Back",
    next: lang === "ru" ? "Далее" : "Continue",
    record: lang === "ru" ? "Записать" : "Record",
    stop: lang === "ru" ? "Остановить" : "Stop",
    rerecord: lang === "ru" ? "Перезаписать" : "Re-record",
    writePh: lang === "ru" ? "Расскажите случай, шутку, доброе слово…" : "Share a story, a joke, a kind word…",
    captionPh: lang === "ru" ? "Несколько слов о фото (необязательно)" : "A few words about the photo (optional)",
    addPhotos: lang === "ru" ? "Выбрать фото" : "Choose photos",
    yourName: lang === "ru" ? "Ваше имя" : "Your name",
    yourEmail: lang === "ru" ? "Email (необязательно)" : "Email (optional)",
    nameHint:
      lang === "ru"
        ? "Чтобы родные знали, от кого это воспоминание"
        : "So the family knows who shared this memory",
    submit: lang === "ru" ? "Сохранить воспоминание" : "Save Memory",
    sending: lang === "ru" ? "Отправляем…" : "Sending…",
    thanksTitle: lang === "ru" ? "Спасибо ❤" : "Thank you ❤",
    thanksBody:
      lang === "ru"
        ? "Ваше воспоминание сохранено. Семья будет очень благодарна."
        : "Your memory has been saved. The family will be deeply grateful.",
    addAnother: lang === "ru" ? "Добавить ещё одно" : "Add another",
    nameRequired: lang === "ru" ? "Пожалуйста, укажите имя" : "Please share your name",
    empty: lang === "ru" ? "Сначала добавьте воспоминание" : "Add a memory first",
  };

  const goChoose = () => setStep("choose");

  const pickMode = (m: Mode) => {
    setMode(m);
    setStep(m);
  };

  const canGoToDetails = () => {
    if (mode === "voice") return !!recorder.recording;
    if (mode === "text") return textContent.trim().length > 0;
    if (mode === "photo") return photoFiles.length > 0;
    return false;
  };

  const handleSubmit = async () => {
    if (!guestName.trim()) {
      toast.error(t.nameRequired);
      return;
    }
    if (!canGoToDetails()) {
      toast.error(t.empty);
      return;
    }

    setSubmitting(true);
    try {
      let voicePath: string | null = null;
      let photoUrls: string[] = [];

      // 1) Upload voice if needed
      if (mode === "voice" && recorder.recording) {
        const path = `guest/${circle.id}/${crypto.randomUUID()}.webm`;
        const { error: upErr } = await supabase.storage
          .from("voice-notes")
          .upload(path, recorder.recording.blob, { contentType: "audio/webm" });
        if (upErr) throw upErr;
        voicePath = path;
      }

      // 2) Upload photos if needed
      if (mode === "photo" && photoFiles.length > 0) {
        for (const f of photoFiles) {
          const ext = f.name.split(".").pop() || "jpg";
          const path = `guest/${circle.id}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("memory-photos")
            .upload(path, f, { contentType: f.type || undefined });
          if (upErr) throw upErr;
          const { data } = supabase.storage.from("memory-photos").getPublicUrl(path);
          photoUrls.push(data.publicUrl);
        }
      }

      const content =
        mode === "text"
          ? textContent.trim()
          : mode === "photo"
            ? photoCaption.trim() || null
            : null;

      // 3) Submit via SECURITY DEFINER RPC (works for anon)
      const { error } = await supabase.rpc("submit_guest_memory", {
        _invite_code: code!,
        _guest_name: guestName.trim(),
        _guest_email: guestEmail.trim() || null,
        _content: content,
        _voice_note_path: voicePath,
        _photo_urls: photoUrls.length ? photoUrls : null,
      });
      if (error) throw error;

      setStep("done");
    } catch (err: any) {
      console.error(err);
      toast.error(lang === "ru" ? "Не удалось сохранить" : "Couldn't save memory");
    } finally {
      setSubmitting(false);
    }
  };

  const resetDraft = () => {
    setMode(null);
    setTextContent("");
    setPhotoFiles([]);
    setPhotoCaption("");
    recorder.reset();
    setGuestName("");
    setGuestEmail("");
    setStep("choose");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <BackgroundPattern />
      <header className="flex items-center gap-3 px-6 pt-14 pb-4 relative z-10">
        <button
          onClick={() => {
            if (step === "hero" || step === "done") navigate("/");
            else if (step === "choose") setStep("hero");
            else if (step === "details") setStep(mode || "choose");
            else setStep("choose");
          }}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t.back}
        >
          <ChevronLeft size={24} />
        </button>
        <StaticLogo size={32} />
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pb-16 relative z-10">
        {/* HERO */}
        {step === "hero" && (
          <div className="w-full max-w-md text-center animate-page-flip">
            <div className="mt-2 mb-6 flex justify-center">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={personName}
                  className="w-36 h-36 rounded-full object-cover shadow-warm border-4 border-background"
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-accent flex items-center justify-center shadow-warm border-4 border-background">
                  <Heart size={44} className="text-muted-foreground" />
                </div>
              )}
            </div>

            <h1 className="font-serif-display text-3xl font-light text-foreground leading-tight">
              {personName}
            </h1>
            {years && <p className="text-sm text-muted-foreground mt-1 tracking-wide">{years}</p>}

            <p className="font-serif-display italic text-base text-foreground/80 leading-relaxed mt-6 px-2">
              {heartfeltMessage}
            </p>

            {circle.description && (
              <p className="text-sm text-muted-foreground mt-4 px-2">{circle.description}</p>
            )}

            <Button
              onClick={goChoose}
              size="lg"
              className="w-full rounded-2xl py-6 text-base mt-10 shadow-warm press"
            >
              <Heart size={18} className="mr-2" />
              {t.share}
            </Button>

            <p className="text-[11px] text-muted-foreground mt-4">
              {lang === "ru"
                ? "Не нужно регистрироваться — просто поделитесь"
                : "No sign-up required — just share"}
            </p>
          </div>
        )}

        {/* CHOOSE MODE */}
        {step === "choose" && (
          <div className="w-full max-w-md animate-page-flip">
            <h2 className="font-serif-display text-2xl text-foreground text-center mb-2">
              {t.chooseHow}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-8">
              {personName}
            </p>

            <div className="space-y-3">
              {[
                { m: "voice" as Mode, icon: Mic, label: t.voice, hint: t.voiceHint },
                { m: "text" as Mode, icon: TypeIcon, label: t.text, hint: t.textHint },
                { m: "photo" as Mode, icon: ImageIcon, label: t.photo, hint: t.photoHint },
              ].map((opt) => (
                <button
                  key={opt.m}
                  onClick={() => pickMode(opt.m)}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-soft hover:shadow-warm transition-all press text-left"
                >
                  <span className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <opt.icon size={22} />
                  </span>
                  <span className="flex-1">
                    <span className="block font-serif-display text-lg text-foreground">
                      {opt.label}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {opt.hint}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VOICE */}
        {step === "voice" && (
          <div className="w-full max-w-md text-center animate-page-flip">
            <h2 className="font-serif-display text-2xl text-foreground mb-2">{t.voice}</h2>
            <p className="text-sm text-muted-foreground mb-10">{personName}</p>

            {recorder.error && (
              <p className="text-xs text-destructive mb-4">
                {lang === "ru" ? "Нет доступа к микрофону" : "Microphone access denied"}
              </p>
            )}

            {!recorder.recording ? (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={recorder.isRecording ? recorder.stop : recorder.start}
                  className={`w-28 h-28 rounded-full flex items-center justify-center shadow-warm transition-all press ${
                    recorder.isRecording
                      ? "bg-destructive text-destructive-foreground animate-pulse"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {recorder.isRecording ? <Square size={32} /> : <Mic size={36} />}
                </button>
                <p className="text-2xl font-serif-display text-foreground tabular-nums">
                  {recorder.formatTime(recorder.elapsed)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {recorder.isRecording
                    ? lang === "ru" ? "Нажмите, чтобы остановить" : "Tap to stop"
                    : lang === "ru" ? "Нажмите, чтобы начать запись" : "Tap to start recording"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <audio src={recorder.recording.url} controls className="w-full" />
                <button onClick={recorder.reset} className="text-sm text-muted-foreground hover:text-foreground underline">
                  {t.rerecord}
                </button>
              </div>
            )}

            <Button
              onClick={() => setStep("details")}
              disabled={!recorder.recording}
              size="lg"
              className="w-full rounded-2xl py-5 text-base mt-10 press"
            >
              {t.next}
            </Button>
          </div>
        )}

        {/* TEXT */}
        {step === "text" && (
          <div className="w-full max-w-md animate-page-flip">
            <h2 className="font-serif-display text-2xl text-foreground text-center mb-2">{t.text}</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">{personName}</p>

            {topic && (
              <p className="text-sm text-foreground/80 italic font-serif-display bg-accent/40 rounded-xl p-3 mb-4 text-center">
                {decodeURIComponent(topic)}
              </p>
            )}

            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder={t.writePh}
              rows={10}
              className="rounded-2xl resize-none text-base leading-relaxed shadow-soft"
            />

            <Button
              onClick={() => setStep("details")}
              disabled={!textContent.trim()}
              size="lg"
              className="w-full rounded-2xl py-5 text-base mt-6 press"
            >
              {t.next}
            </Button>
          </div>
        )}

        {/* PHOTO */}
        {step === "photo" && (
          <div className="w-full max-w-md animate-page-flip">
            <h2 className="font-serif-display text-2xl text-foreground text-center mb-2">{t.photo}</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">{personName}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setPhotoFiles((prev) => [...prev, ...files].slice(0, 6));
              }}
            />

            {photoFiles.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all press shadow-soft"
              >
                <ImageIcon size={36} className="mb-2" />
                <span className="font-serif-display text-base">{t.addPhotos}</span>
              </button>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {photoFiles.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden shadow-soft">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setPhotoFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {photoFiles.length < 6 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground"
                    >
                      +
                    </button>
                  )}
                </div>
                <Textarea
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder={t.captionPh}
                  rows={3}
                  className="rounded-2xl resize-none shadow-soft"
                />
              </>
            )}

            <Button
              onClick={() => setStep("details")}
              disabled={photoFiles.length === 0}
              size="lg"
              className="w-full rounded-2xl py-5 text-base mt-6 press"
            >
              {t.next}
            </Button>
          </div>
        )}

        {/* DETAILS (collected at the END, guest mode) */}
        {step === "details" && (
          <div className="w-full max-w-md animate-page-flip">
            <h2 className="font-serif-display text-2xl text-foreground text-center mb-2">
              {lang === "ru" ? "Почти готово" : "Almost done"}
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-8">{t.nameHint}</p>

            <div className="space-y-3">
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder={t.yourName}
                className="rounded-2xl py-6 text-base shadow-soft"
                autoFocus
              />
              <Input
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder={t.yourEmail}
                type="email"
                className="rounded-2xl py-6 text-base shadow-soft"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !guestName.trim()}
              size="lg"
              className="w-full rounded-2xl py-6 text-base mt-8 shadow-warm press"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" /> {t.sending}
                </>
              ) : (
                <>
                  <Check size={18} className="mr-2" /> {t.submit}
                </>
              )}
            </Button>
          </div>
        )}

        {/* DONE */}
        {step === "done" && (
          <div className="w-full max-w-md text-center animate-page-flip mt-10">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Heart size={36} className="text-primary" />
            </div>
            <h2 className="font-serif-display text-3xl text-foreground mb-3">{t.thanksTitle}</h2>
            <p className="text-base text-muted-foreground leading-relaxed px-2">{t.thanksBody}</p>

            <Button
              onClick={resetDraft}
              size="lg"
              variant="outline"
              className="w-full rounded-2xl py-5 text-base mt-10 press"
            >
              {t.addAnother}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default JoinCirclePage;