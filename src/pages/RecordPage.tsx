import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { saveEntry, generateStory } from "@/lib/diary-store";
import { ArrowLeft, Mic, Square, Play, Pause, RotateCcw, Send } from "lucide-react";

const RecordPage = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const question = (location.state as any)?.question || "";

  const recorder = useAudioRecorder();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleToggleRecord = () => {
    if (recorder.isRecording) {
      recorder.stop();
    } else {
      recorder.start();
    }
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    recorder.reset();
  };

  const handleSubmit = () => {
    if (!recorder.recording) return;

    const answerText =
      lang === "ru"
        ? `[Голосовая запись — ${recorder.formatTime(Math.round(recorder.recording.duration))}]`
        : `[Voice recording — ${recorder.formatTime(Math.round(recorder.recording.duration))}]`;

    const story = generateStory(question, answerText, lang);
    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      question,
      answer: answerText,
      story,
      audioUrl: recorder.recording.url,
    };

    saveEntry(entry);
    navigate("/result", { state: { entry } });
  };

  const hint =
    lang === "ru"
      ? "Говорите свободно, как будто рассказываете другу"
      : "Speak freely, as if you're telling a friend";

  const micError =
    lang === "ru"
      ? "Не удалось получить доступ к микрофону"
      : "Could not access the microphone";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 pt-14 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl text-foreground hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{t("recordAudio")}</h1>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pb-8">
        {/* Question context */}
        <div className="w-full max-w-md bg-diary-warm-light rounded-2xl p-5 mb-8 animate-fade-in">
          <p className="text-base text-accent-foreground font-medium leading-relaxed text-center">
            {question}
          </p>
        </div>

        {/* Center area */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
          {/* Error */}
          {recorder.error && (
            <p className="text-destructive text-sm font-medium mb-6 text-center">
              {micError}
            </p>
          )}

          {/* No recording yet — show big record button */}
          {!recorder.recording && (
            <div className="flex flex-col items-center gap-6 animate-fade-in">
              {/* Pulse rings behind mic button */}
              <div className="relative">
                {recorder.isRecording && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
                    <span className="absolute -inset-4 rounded-full bg-destructive/10 animate-pulse" />
                  </>
                )}
                <button
                  onClick={handleToggleRecord}
                  className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg ${
                    recorder.isRecording
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {recorder.isRecording ? (
                    <Square size={36} fill="currentColor" />
                  ) : (
                    <Mic size={44} />
                  )}
                </button>
              </div>

              {/* Timer or hint */}
              {recorder.isRecording ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-3xl font-light text-foreground tabular-nums tracking-wider">
                    {recorder.formatTime(recorder.elapsed)}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">
                    {t("recording")}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground font-medium text-center max-w-[260px] leading-relaxed">
                  {hint}
                </p>
              )}
            </div>
          )}

          {/* Has recording — show playback + actions */}
          {recorder.recording && (
            <div className="flex flex-col items-center gap-8 w-full animate-scale-in">
              {/* Playback visualization card */}
              <div className="w-full bg-card rounded-3xl p-8 border border-border shadow-sm">
                {/* Waveform placeholder bars */}
                <div className="flex items-center justify-center gap-[3px] h-16 mb-6">
                  {Array.from({ length: 32 }).map((_, i) => {
                    const height = 12 + Math.sin(i * 0.7) * 28 + Math.random() * 16;
                    return (
                      <div
                        key={i}
                        className={`w-[3px] rounded-full transition-colors duration-300 ${
                          isPlaying ? "bg-primary" : "bg-border"
                        }`}
                        style={{ height: `${Math.max(8, height)}px` }}
                      />
                    );
                  })}
                </div>

                {/* Duration */}
                <p className="text-center text-lg text-foreground font-light tabular-nums">
                  {recorder.formatTime(Math.round(recorder.recording.duration))}
                </p>
              </div>

              {/* Playback controls */}
              <div className="flex items-center gap-6">
                <button
                  onClick={handleReRecord}
                  className="w-14 h-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center transition-all active:scale-95"
                >
                  <RotateCcw size={22} />
                </button>

                <button
                  onClick={handlePlay}
                  className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg transition-all active:scale-95"
                >
                  {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                </button>

                <div className="w-14 h-14" /> {/* spacer for symmetry */}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-medium transition-all active:scale-[0.97] hover:opacity-90 mt-2"
              >
                <Send size={20} />
                {t("save")}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RecordPage;
