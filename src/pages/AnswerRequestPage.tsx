import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import BackgroundPattern from "@/components/BackgroundPattern";
import StaticLogo from "@/components/StaticLogo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { Mic, Square, Trash2, ChevronLeft, Loader2, Heart, Volume2 } from "lucide-react";
import { toast } from "sonner";

const AnswerRequestPage = () => {
  const { code } = useParams<{ code: string }>();
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const rec = useAudioRecorder();

  const [request, setRequest] = useState<any>(null);
  const [circle, setCircle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate(`/auth?redirect=/memory-circle/request/${code}`);
      return;
    }
    if (code) load();
    // eslint-disable-next-line
  }, [code, user]);

  const load = async () => {
    const { data: req } = await supabase
      .from("memory_requests")
      .select("*")
      .eq("code", code!)
      .maybeSingle();
    if (!req) { setLoading(false); return; }
    setRequest(req);

    const { data: c } = await supabase
      .from("memory_circles")
      .select("*")
      .eq("id", req.circle_id)
      .maybeSingle();
    setCircle(c);

    if (req.voice_path) {
      const { data } = await supabase.storage
        .from("voice-notes")
        .createSignedUrl(req.voice_path, 3600);
      if (data?.signedUrl) setVoiceUrl(data.signedUrl);
    }
    setLoading(false);
  };

  const ensureMember = async () => {
    if (!user || !circle) return;
    const { data } = await supabase
      .from("circle_members")
      .select("id")
      .eq("circle_id", circle.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data && circle.creator_id !== user.id) {
      await supabase.from("circle_members").insert({
        circle_id: circle.id,
        user_id: user.id,
        role_label: "friend",
        status: "active",
      });
    }
  };

  const handleSubmit = async () => {
    if (!user || !request || !circle) return;
    if (!answer.trim() && !rec.recording) {
      toast.error(lang === "ru" ? "Запишите голос или напишите ответ" : "Record or type your answer");
      return;
    }
    setSubmitting(true);
    await ensureMember();

    let voicePath: string | null = null;
    if (rec.recording) {
      const path = `${user.id}/${crypto.randomUUID()}.webm`;
      const up = await supabase.storage
        .from("voice-notes")
        .upload(path, rec.recording.blob, { contentType: "audio/webm" });
      if (up.error) {
        toast.error(lang === "ru" ? "Не удалось загрузить" : "Upload failed");
        setSubmitting(false);
        return;
      }
      voicePath = path;
    }

    const { error } = await supabase.from("circle_memories").insert({
      circle_id: circle.id,
      author_id: user.id,
      question: request.question,
      content: answer.trim() || null,
      voice_note_path: voicePath,
      category: request.category,
      life_period: request.life_period,
      request_id: request.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error(lang === "ru" ? "Ошибка сохранения" : "Save failed");
      return;
    }
    setDone(true);
    toast.success(lang === "ru" ? "Спасибо за вашу историю" : "Thank you for your story");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 size={28} className="text-primary animate-spin" />
    </div>;
  }

  if (!request || !circle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <p className="text-muted-foreground mb-4">{lang === "ru" ? "Запрос не найден" : "Request not found"}</p>
        <Button onClick={() => navigate("/")} variant="outline">{lang === "ru" ? "На главную" : "Go home"}</Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col bg-background relative">
        <BackgroundPattern />
        <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Heart size={28} className="text-primary" />
          </div>
          <h2 className="text-2xl font-serif-display font-light text-foreground mb-2">
            {lang === "ru" ? "Спасибо" : "Thank you"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            {lang === "ru"
              ? `Ваша история о ${circle.person_name} сохранена в Книге Памяти.`
              : `Your story about ${circle.person_name} has been added to the Book of Memory.`}
          </p>
          <Button onClick={() => navigate(`/memory-circle/${circle.id}`)} className="rounded-2xl" size="lg">
            {lang === "ru" ? "Открыть Книгу" : "Open the Book"}
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <BackgroundPattern />
      <header className="flex items-center gap-3 px-6 pt-14 pb-4 relative z-10">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <StaticLogo size={32} />
      </header>

      <main className="flex-1 px-6 pb-12 relative z-10">
        <div className="max-w-md mx-auto">
          {/* Person header */}
          <div className="text-center mb-6">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              {lang === "ru" ? "Воспоминание о" : "A memory of"}
            </p>
            <h1 className="text-2xl font-serif-display font-light text-foreground">
              {circle.person_name}
            </h1>
          </div>

          {/* The question */}
          <div className="bg-card border border-primary/20 rounded-3xl p-6 mb-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-3">
              {lang === "ru" ? "Вопрос для вас" : "A question for you"}
            </p>
            <p className="text-lg font-serif-display text-foreground leading-relaxed">
              "{request.question}"
            </p>

            {voiceUrl && (
              <div className="mt-4 bg-primary/5 rounded-2xl p-3 flex items-center gap-2">
                <Volume2 size={16} className="text-primary flex-shrink-0" />
                <audio controls src={voiceUrl} className="flex-1 h-9" />
              </div>
            )}
          </div>

          {/* Single focused action: Record */}
          {!rec.recording ? (
            <button
              onClick={rec.isRecording ? rec.stop : rec.start}
              className={`w-full rounded-3xl py-8 flex flex-col items-center gap-3 transition-all ${
                rec.isRecording
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {rec.isRecording ? <Square size={32} /> : <Mic size={32} />}
              <span className="text-base font-medium">
                {rec.isRecording
                  ? `${lang === "ru" ? "Остановить" : "Stop"} • ${rec.formatTime(rec.elapsed)}`
                  : (lang === "ru" ? "Записать историю" : "Record Story")}
              </span>
              {!rec.isRecording && (
                <span className="text-xs opacity-80">
                  {lang === "ru" ? "Нажмите и говорите" : "Tap and speak"}
                </span>
              )}
            </button>
          ) : (
            <div className="bg-card border border-border rounded-3xl p-4 space-y-3">
              <audio controls src={rec.recording.url} className="w-full" />
              <div className="flex gap-2">
                <Button onClick={rec.reset} variant="outline" className="flex-1 rounded-2xl">
                  <Trash2 size={14} className="mr-1.5" />
                  {lang === "ru" ? "Перезаписать" : "Re-record"}
                </Button>
              </div>
            </div>
          )}

          {rec.error && (
            <p className="text-xs text-destructive text-center mt-2">
              {lang === "ru" ? "Нет доступа к микрофону" : "Microphone access denied"}
            </p>
          )}

          {/* Or type */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {lang === "ru" ? "или напишите" : "or type"}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={lang === "ru" ? "Напишите вашу историю..." : "Write your story..."}
            className="rounded-2xl min-h-[120px] resize-none mb-4"
          />

          <Button
            onClick={handleSubmit}
            disabled={submitting || (!answer.trim() && !rec.recording)}
            size="lg"
            className="w-full rounded-2xl py-6 text-base"
          >
            {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
            {lang === "ru" ? "Поделиться историей" : "Share my story"}
          </Button>

          <p className="text-[10px] text-muted-foreground text-center mt-4">
            {lang === "ru"
              ? `Ваша история будет добавлена в Книгу Памяти о ${circle.person_name}.`
              : `Your story will be added to the Book of Memory for ${circle.person_name}.`}
          </p>
        </div>
      </main>
    </div>
  );
};

export default AnswerRequestPage;