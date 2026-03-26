import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { saveEntryToDb, chapterLabels } from "@/lib/diary-store";
import { transcribeAudio } from "@/lib/ai-service";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Mic, Square, Play, Pause, RotateCcw, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ProcessingStep = null | "transcribing" | "saving";

const RecordPage = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const question = (location.state as any)?.question || "";
  const chapter = (location.state as any)?.chapter || "reflections";

  const recorder = useAudioRecorder();
  const [isPlaying, setIsPlaying] = useState(false);
  const [processing, setProcessing] = useState<ProcessingStep>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const chapterLabel = chapterLabels[lang]?.[chapter] || chapter;

  const handleToggleRecord = () => {
    if (recorder.isRecording) recorder.stop();
    else recorder.start();
  };

  const handlePlay = () => {
    if (!recorder.recording) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(recorder.recording.url);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleReRecord = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsPlaying(false);
    recorder.reset();
  };

  const handleSubmit = async () => {
    if (!recorder.recording || !user) return;
    try {
      setProcessing("transcribing");
      const transcript = await transcribeAudio(recorder.recording.blob, lang);
      if (!transcript.trim()) {
        toast.error(lang === "ru" ? "Не удалось распознать речь. Попробуйте ещё раз." : "Could not recognize speech. Please try again.");
        setProcessing(null);
        return;
      }

      // Save voice recording for future voice synthesis
      const voicePath = `${user.id}/entry-${Date.now()}.webm`;
      await supabase.storage.from("voice-notes").upload(voicePath, recorder.recording.blob);
      await supabase.from("voice_recordings").insert({
        user_id: user.id,
        storage_path: voicePath,
        duration_seconds: recorder.recording.duration,
        field_key: "entry",
      });

      setProcessing("saving");
      // Chapter is already known from the question
      const id = await saveEntryToDb({
        question,
        original_text: transcript,
        ai_story: transcript,
        chapter,
      });

      setProcessing(null);
      navigate("/result", {
        state: {
          entry: {
            id,
            date: new Date().toISOString(),
            question,
            answer: transcript,
            story: transcript,
            chapter,
          },
        },
      });
    } catch (err: any) {
      setProcessing(null);
      if (err.message === "rate_limited") {
        toast.error(lang === "ru" ? "Слишком много запросов." : "Too many requests.");
      } else if (err.message === "payment_required") {
        toast.error(lang === "ru" ? "Необходимо пополнить баланс." : "Credits need to be topped up.");
      } else {
        toast.error(lang === "ru" ? "Произошла ошибка." : "Something went wrong.");
      }
      console.error("Submit error:", err);
    }
  };

  const hint = lang === "ru" ? "Говорите свободно, как будто рассказываете другу" : "Speak freely, as if you're telling a friend";
  const micError = lang === "ru" ? "Не удалось получить доступ к микрофону" : "Could not access the microphone";
  const processingLabel = processing === "transcribing"
    ? (lang === "ru" ? "Распознаю речь..." : "Transcribing...")
    : (lang === "ru" ? "Сохраняю запись..." : "Saving...");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center gap-3 px-6 pt-14 pb-4">
        <button onClick={() => navigate(-1)} disabled={!!processing} className="p-2 -ml-2 rounded-xl text-foreground hover:bg-secondary transition-colors disabled:opacity-40">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">{t("recordAudio")}</h1>
          <span className="text-[10px] text-primary font-medium">{chapterLabel}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pb-8">
        <div className="w-full max-w-md bg-diary-warm-light rounded-2xl p-5 mb-8 animate-fade-in">
          <p className="text-base text-accent-foreground font-medium leading-relaxed text-center">{question}</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
          {recorder.error && <p className="text-destructive text-sm font-medium mb-6 text-center">{micError}</p>}

          {processing && (
            <div className="flex flex-col items-center gap-6 animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 size={40} className="text-primary animate-spin" />
              </div>
              <p className="text-lg font-medium text-foreground">{processingLabel}</p>
              <p className="text-sm text-muted-foreground text-center max-w-[260px]">{lang === "ru" ? "Это займёт несколько секунд" : "This will take a few seconds"}</p>
            </div>
          )}

          {!recorder.recording && !processing && (
            <div className="flex flex-col items-center gap-6 animate-fade-in">
              <div className="relative">
                {recorder.isRecording && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
                    <span className="absolute -inset-4 rounded-full bg-destructive/10 animate-pulse" />
                  </>
                )}
                <button onClick={handleToggleRecord} className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg ${recorder.isRecording ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
                  {recorder.isRecording ? <Square size={36} fill="currentColor" /> : <Mic size={44} />}
                </button>
              </div>
              {recorder.isRecording ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-3xl font-light text-foreground tabular-nums tracking-wider">{recorder.formatTime(recorder.elapsed)}</p>
                  <p className="text-sm text-muted-foreground font-medium">{t("recording")}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground font-medium text-center max-w-[260px] leading-relaxed">{hint}</p>
              )}
            </div>
          )}

          {recorder.recording && !processing && (
            <div className="flex flex-col items-center gap-8 w-full animate-scale-in">
              <div className="w-full bg-card rounded-3xl p-8 border border-border shadow-sm">
                <div className="flex items-center justify-center gap-[3px] h-16 mb-6">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const height = 12 + Math.sin(i * 0.7) * 28 + Math.random() * 16;
                    return <div key={i} className={`w-[3px] rounded-full transition-colors duration-300 ${isPlaying ? "bg-primary" : "bg-border"}`} style={{ height: `${Math.max(8, height)}px` }} />;
                  })}
                </div>
                <p className="text-center text-lg text-foreground font-light tabular-nums">{recorder.formatTime(Math.round(recorder.recording.duration))}</p>
              </div>
              <div className="flex items-center gap-6">
                <button onClick={handleReRecord} className="w-14 h-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center transition-all active:scale-95"><RotateCcw size={22} /></button>
                <button onClick={handlePlay} className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg transition-all active:scale-95">{isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}</button>
                <div className="w-14 h-14" />
              </div>
              <button onClick={handleSubmit} className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-medium transition-all active:scale-[0.97] hover:opacity-90 mt-2"><Send size={20} />{t("save")}</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RecordPage;
