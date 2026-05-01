import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, Loader2, X, Eye, HelpCircle } from "lucide-react";
import { toast } from "sonner";

type Props = {
  lang: "ru" | "en";
  personName: string;
  onPickQuestion?: (question: string) => void;
};

type Result = { observations: string[]; questions: string[] };

const PhotoQuestionAssistant = ({ lang, personName, onPickQuestion }: Props) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRu = lang === "ru";

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(isRu ? "Только изображения" : "Images only");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(isRu ? "Файл слишком большой (макс. 10 МБ)" : "File too large (max 10 MB)");
      return;
    }

    setUploading(true);
    setResult(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/ai-suggest/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("memory-photos")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("memory-photos").getPublicUrl(path);
      setPreviewUrl(pub.publicUrl);
      setUploading(false);

      // analyze
      setAnalyzing(true);
      const { data, error } = await supabase.functions.invoke("suggest-photo-questions", {
        body: { image_url: pub.publicUrl, person_name: personName, lang },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as Result);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || (isRu ? "Не удалось проанализировать фото" : "Failed to analyze photo"));
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-4 mb-6">
      <div className="flex items-start gap-2 mb-3">
        <Sparkles size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground">
            {isRu ? "ИИ-помощник по фото" : "AI photo assistant"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRu
              ? "Загрузите фото — ИИ предложит вопросы для воспоминаний на основе того, что видит."
              : "Upload a photo — AI will suggest memory-prompting questions based on what it sees."}
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {!previewUrl && (
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          variant="outline"
          className="w-full rounded-xl border-primary/30 text-primary hover:bg-primary/5"
        >
          {uploading ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <Upload size={16} className="mr-2" />
          )}
          {isRu ? "Загрузить фото" : "Upload a photo"}
        </Button>
      )}

      {previewUrl && (
        <div className="space-y-3">
          <div className="relative">
            <img src={previewUrl} alt="" className="w-full rounded-xl max-h-56 object-cover" />
            <button
              onClick={reset}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 border border-border flex items-center justify-center text-foreground hover:bg-background"
              aria-label="Remove"
            >
              <X size={14} />
            </button>
          </div>

          {analyzing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={14} className="animate-spin text-primary" />
              {isRu ? "ИИ изучает фото..." : "AI is studying the photo..."}
            </div>
          )}

          {result && (
            <>
              {result.observations?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Eye size={12} className="text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {isRu ? "Что видно на фото" : "What's in the photo"}
                    </span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-0.5 pl-4 list-disc">
                    {result.observations.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.questions?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <HelpCircle size={12} className="text-primary" />
                    <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                      {isRu ? "Предлагаемые вопросы" : "Suggested questions"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {result.questions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (onPickQuestion) onPickQuestion(q);
                          else {
                            navigator.clipboard?.writeText(q);
                            toast.success(isRu ? "Скопировано" : "Copied");
                          }
                        }}
                        className="w-full text-left text-sm text-foreground bg-background border border-border hover:border-primary/40 hover:bg-primary/5 rounded-xl px-3 py-2 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground italic pt-1 border-t border-border/50">
                {isRu
                  ? "ИИ опирается только на то, что видно на фото. Он не имитирует голос ушедшего."
                  : "AI relies only on what's visible in the photo. It does not imitate the deceased's voice."}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoQuestionAssistant;