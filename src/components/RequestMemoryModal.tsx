import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Trash2, Copy, Check, Share2, MessageCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  circleId: string;
  personName: string;
  onCreated?: () => void;
};

const RequestMemoryModal = ({ open, onClose, circleId, personName, onCreated }: Props) => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const rec = useAudioRecorder();
  const [question, setQuestion] = useState("");
  const [saving, setSaving] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const link = createdCode
    ? `${window.location.origin}/memory-circle/request/${createdCode}`
    : "";

  const inviteText = lang === "ru"
    ? `У меня есть вопрос про ${personName}. Запишите голосом или напишите свой ответ: ${link}`
    : `I have a question about ${personName}. Record or type your answer: ${link}`;

  const reset = () => {
    setQuestion("");
    setCreatedCode(null);
    setCopied(false);
    rec.reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!user || !question.trim()) return;
    setSaving(true);
    let voicePath: string | null = null;

    if (rec.recording) {
      const path = `requests/${circleId}/${crypto.randomUUID()}.webm`;
      const up = await supabase.storage
        .from("voice-notes")
        .upload(path, rec.recording.blob, { contentType: "audio/webm" });
      if (up.error) {
        toast.error(lang === "ru" ? "Не удалось загрузить голос" : "Voice upload failed");
        setSaving(false);
        return;
      }
      voicePath = path;
    }

    const { data, error } = await supabase
      .from("memory_requests")
      .insert({
        circle_id: circleId,
        creator_id: user.id,
        question: question.trim(),
        voice_path: voicePath,
      })
      .select("code")
      .single();

    setSaving(false);
    if (error || !data) {
      toast.error(lang === "ru" ? "Ошибка" : "Error");
      return;
    }
    setCreatedCode(data.code);
    onCreated?.();
    toast.success(lang === "ru" ? "Запрос создан" : "Request created");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteText);
    setCopied(true);
    toast.success(lang === "ru" ? "Скопировано" : "Copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: inviteText, url: link }); } catch {}
    } else copyLink();
  };

  const openWhatsApp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, "_blank");
  const openTelegram = () =>
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(inviteText)}`, "_blank");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="rounded-3xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif-display font-light text-xl">
            {lang === "ru" ? "Попросить воспоминание" : "Request a memory"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {lang === "ru"
              ? `Задайте конкретный вопрос — близкие получат ссылку и сразу ответят.`
              : `Ask a specific question — relatives get a link and answer right away.`}
          </DialogDescription>
        </DialogHeader>

        {!createdCode ? (
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                {lang === "ru" ? "Ваш вопрос" : "Your question"}
              </label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  lang === "ru"
                    ? `Например: "Расскажи самую смешную историю про ${personName}"`
                    : `e.g. "Tell me the funniest story about ${personName}"`
                }
                className="rounded-xl min-h-[90px] resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                {lang === "ru" ? "Голосовое сообщение (необязательно)" : "Voice message (optional)"}
              </label>
              <div className="bg-secondary/50 rounded-2xl p-3 flex items-center gap-3">
                {!rec.recording ? (
                  <Button
                    type="button"
                    onClick={rec.isRecording ? rec.stop : rec.start}
                    variant={rec.isRecording ? "destructive" : "outline"}
                    size="sm"
                    className="rounded-full"
                  >
                    {rec.isRecording ? <Square size={14} className="mr-1.5" /> : <Mic size={14} className="mr-1.5" />}
                    {rec.isRecording
                      ? `${lang === "ru" ? "Стоп" : "Stop"} ${rec.formatTime(rec.elapsed)}`
                      : (lang === "ru" ? "Записать" : "Record")}
                  </Button>
                ) : (
                  <>
                    <audio controls src={rec.recording.url} className="flex-1 h-8" />
                    <button onClick={rec.reset} className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
              {rec.error && (
                <p className="text-[10px] text-destructive mt-1">
                  {lang === "ru" ? "Нет доступа к микрофону" : "Microphone access denied"}
                </p>
              )}
            </div>

            <Button
              onClick={handleCreate}
              disabled={!question.trim() || saving}
              className="w-full rounded-2xl"
              size="lg"
            >
              {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
              {lang === "ru" ? "Создать ссылку" : "Create link"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3">
              <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">
                {lang === "ru" ? "Ссылка готова" : "Link ready"}
              </p>
              <p className="text-[11px] font-mono text-muted-foreground break-all">{link}</p>
            </div>

            <Button onClick={copyLink} variant="outline" className="w-full rounded-2xl">
              {copied ? <Check size={15} className="mr-2" /> : <Copy size={15} className="mr-2" />}
              {lang === "ru" ? "Скопировать с текстом" : "Copy with message"}
            </Button>

            <div className="grid grid-cols-3 gap-2">
              <Button onClick={openWhatsApp} variant="secondary" className="rounded-2xl flex-col h-auto py-3 gap-1">
                <MessageCircle size={18} className="text-green-600" />
                <span className="text-[10px]">WhatsApp</span>
              </Button>
              <Button onClick={openTelegram} variant="secondary" className="rounded-2xl flex-col h-auto py-3 gap-1">
                <Send size={18} className="text-blue-500" />
                <span className="text-[10px]">Telegram</span>
              </Button>
              <Button onClick={shareNative} variant="secondary" className="rounded-2xl flex-col h-auto py-3 gap-1">
                <Share2 size={18} />
                <span className="text-[10px]">{lang === "ru" ? "Ещё" : "More"}</span>
              </Button>
            </div>

            <Button onClick={handleClose} variant="ghost" className="w-full rounded-2xl">
              {lang === "ru" ? "Готово" : "Done"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RequestMemoryModal;