import { useState } from "react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Mic, Square, Loader2, Play, Pause } from "lucide-react";
import { toast } from "sonner";

interface VoiceInputProps {
  fieldKey: string;
  onTranscribed: (text: string) => void;
  lang: "ru" | "en";
}

const VoiceInput = ({ fieldKey, onTranscribed, lang }: VoiceInputProps) => {
  const { user } = useAuth();
  const { isRecording, recording, elapsed, start, stop, reset, formatTime } = useAudioRecorder();
  const [transcribing, setTranscribing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handleStopAndTranscribe = async () => {
    stop();
    // Wait for recording to be available
    setTimeout(async () => {
      await transcribe();
    }, 500);
  };

  const transcribe = async () => {
    if (!recording || !user) return;
    setTranscribing(true);
    try {
      // Upload voice note
      const path = `${user.id}/${fieldKey}-${Date.now()}.webm`;
      await supabase.storage.from("voice-notes").upload(path, recording.blob);

      // Use the existing transcribe edge function
      const formData = new FormData();
      formData.append("audio", recording.blob, "recording.webm");
      formData.append("lang", lang);

      const { data, error } = await supabase.functions.invoke("transcribe", {
        body: formData,
      });

      if (error) throw error;
      if (data?.text) {
        onTranscribed(data.text);
        toast.success(lang === "ru" ? "Текст распознан!" : "Text transcribed!");
        reset();
      }
    } catch {
      toast.error(lang === "ru" ? "Ошибка распознавания" : "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  };

  const togglePlay = () => {
    if (!recording) return;
    if (playing && audio) {
      audio.pause();
      setPlaying(false);
    } else {
      const a = new Audio(recording.url);
      a.onended = () => setPlaying(false);
      a.play();
      setAudio(a);
      setPlaying(true);
    }
  };

  if (transcribing) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 size={14} className="animate-spin" />
        {lang === "ru" ? "Распознаю..." : "Transcribing..."}
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={togglePlay} className="p-1.5 rounded-full bg-primary/10 text-primary">
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          onClick={transcribe}
          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-xl font-medium"
        >
          {lang === "ru" ? "Распознать" : "Transcribe"}
        </button>
        <button onClick={reset} className="text-xs text-muted-foreground underline">
          {lang === "ru" ? "Заново" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={isRecording ? handleStopAndTranscribe : start}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all ${
        isRecording
          ? "bg-destructive/10 text-destructive animate-pulse"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      }`}
    >
      {isRecording ? (
        <>
          <Square size={12} />
          {formatTime(elapsed)}
        </>
      ) : (
        <>
          <Mic size={12} />
          {lang === "ru" ? "Голос" : "Voice"}
        </>
      )}
    </button>
  );
};

export default VoiceInput;
