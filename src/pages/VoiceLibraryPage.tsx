import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Play, Pause, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import StaticLogo from "@/components/StaticLogo";

interface VoiceRecording {
  id: string;
  storage_path: string;
  duration_seconds: number | null;
  field_key: string | null;
  created_at: string;
}

const VoiceLibraryPage = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) loadRecordings();
  }, [user]);

  const loadRecordings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("voice_recordings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRecordings(data || []);
    setLoading(false);
  };

  const togglePlay = async (rec: VoiceRecording) => {
    if (playingId === rec.id && audioEl) {
      audioEl.pause();
      setPlayingId(null);
      return;
    }

    if (audioEl) audioEl.pause();

    const { data } = await supabase.storage.from("voice-notes").createSignedUrl(rec.storage_path, 3600);
    if (!data?.signedUrl) return;
    const audio = new Audio(data.signedUrl);
    audio.onended = () => setPlayingId(null);
    audio.play();
    setAudioEl(audio);
    setPlayingId(rec.id);
  };

  const deleteRecording = async (rec: VoiceRecording) => {
    await supabase.storage.from("voice-notes").remove([rec.storage_path]);
    await supabase.from("voice_recordings").delete().eq("id", rec.id);
    setRecordings((prev) => prev.filter((r) => r.id !== rec.id));
    toast.success(lang === "ru" ? "Запись удалена" : "Recording deleted");
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const totalDuration = recordings.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);

  const fieldLabels: Record<string, Record<string, string>> = {
    ru: {
      full_name: "Имя", city: "Город", occupation: "Профессия",
      family: "Семья", hobbies: "Увлечения", life_motto: "Девиз",
      biggest_dream: "Мечта", advice_to_descendants: "Совет потомкам",
      grateful_for: "Благодарность", would_change: "Изменил бы",
    },
    en: {
      full_name: "Name", city: "City", occupation: "Occupation",
      family: "Family", hobbies: "Hobbies", life_motto: "Life motto",
      biggest_dream: "Dream", advice_to_descendants: "Advice",
      grateful_for: "Grateful for", would_change: "Would change",
    },
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <StaticLogo size={36} />
          <div>
            <h1 className="text-xl font-serif-display font-bold text-foreground">
              {lang === "ru" ? "Голосовая библиотека" : "Voice Library"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {lang === "ru"
                ? "Ваши записи для синтеза голоса"
                : "Your recordings for voice synthesis"}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-2xl font-bold text-foreground">{recordings.length}</p>
            <p className="text-xs text-muted-foreground">
              {lang === "ru" ? "Записей" : "Recordings"}
            </p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-2xl font-bold text-foreground">{formatDuration(totalDuration)}</p>
            <p className="text-xs text-muted-foreground">
              {lang === "ru" ? "Общее время" : "Total time"}
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-6">
          <p className="text-sm text-foreground font-medium mb-1">
            {lang === "ru" ? "🎙 Зачем это нужно?" : "🎙 Why save recordings?"}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {lang === "ru"
              ? "Каждая голосовая запись сохраняется в вашем аккаунте. В будущем они будут использованы для синтеза вашего голоса — чтобы ваши истории звучали именно так, как вы их рассказываете."
              : "Every voice recording is saved to your account. In the future, they will be used to synthesize your voice — so your stories sound exactly as you tell them."}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-12">
            <Mic size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {lang === "ru"
                ? "Пока нет записей. Используйте голосовой ввод в анкете!"
                : "No recordings yet. Use voice input in the profile!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recordings.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border"
              >
                <button
                  onClick={() => togglePlay(rec)}
                  className="p-2 rounded-full bg-primary/10 text-primary shrink-0"
                >
                  {playingId === rec.id ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {rec.field_key
                      ? fieldLabels[lang]?.[rec.field_key] || rec.field_key
                      : lang === "ru" ? "Запись" : "Recording"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(rec.duration_seconds)} •{" "}
                    {new Date(rec.created_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US")}
                  </p>
                </div>
                <button
                  onClick={() => deleteRecording(rec)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default VoiceLibraryPage;
