import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { saveEntry, generateStory } from "@/lib/diary-store";
import { ArrowLeft, Mic, MicOff, Type } from "lucide-react";

const EntryPage = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const question = (location.state as any)?.question || "";

  const [answer, setAnswer] = useState("");
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [isRecording, setIsRecording] = useState(false);

  const handleSave = () => {
    if (!answer.trim()) return;

    const story = generateStory(question, answer, lang);
    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      question,
      answer,
      story,
    };

    saveEntry(entry);
    navigate("/result", { state: { entry } });
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      // In a real app, stop recording and transcribe
      return;
    }

    try {
      // Request microphone access for future implementation
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      // Placeholder: in production, integrate speech-to-text
      setTimeout(() => {
        setIsRecording(false);
        setAnswer((prev) =>
          prev
            ? prev + " " + (lang === "ru" ? "[голосовая запись]" : "[voice note]")
            : lang === "ru"
            ? "[голосовая запись]"
            : "[voice note]"
        );
      }, 3000);
    } catch {
      // Microphone not available
    }
  };

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
        <h1 className="text-lg font-semibold text-foreground">{t("writeAnswer")}</h1>
      </header>

      <main className="flex-1 flex flex-col px-6 pb-8">
        {/* Question */}
        <div className="bg-diary-warm-light rounded-2xl p-5 mb-6 animate-fade-in">
          <p className="text-base text-accent-foreground font-medium leading-relaxed">
            {question}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("text")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
              mode === "text"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <Type size={18} />
            {t("textMode")}
          </button>
          <button
            onClick={() => setMode("voice")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors ${
              mode === "voice"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <Mic size={18} />
            {t("voiceMode")}
          </button>
        </div>

        {/* Input area */}
        {mode === "text" ? (
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t("yourAnswer")}
            className="flex-1 min-h-[200px] w-full bg-card border border-border rounded-2xl p-5 text-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <button
              onClick={toggleRecording}
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                isRecording
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isRecording ? <MicOff size={40} /> : <Mic size={40} />}
            </button>
            <p className="text-sm text-muted-foreground font-medium">
              {isRecording ? t("recording") : t("recordAudio")}
            </p>
            {answer && (
              <div className="w-full bg-card border border-border rounded-2xl p-4 mt-4">
                <p className="text-base text-foreground">{answer}</p>
              </div>
            )}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!answer.trim()}
          className="mt-6 w-full bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-medium transition-all active:scale-[0.97] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("save")}
        </button>
      </main>
    </div>
  );
};

export default EntryPage;
