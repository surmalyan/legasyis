import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, ImagePlus, Loader2, X } from "lucide-react";
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

  const steps = isRu
    ? ["Загрузите фото", "Получите вопросы", "Ответьте"]
    : ["Upload a photo", "Get questions", "Answer"];
  const activeStep = !previewUrl ? 0 : !result ? 1 : 2;

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
    <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-5 mb-6">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} className="text-primary flex-shrink-0" />
        <h3 className="text-lg font-serif-display text-foreground">
          {isRu ? "Вопросы по фото" : "Questions from a photo"}
        </h3>
      </div>

      {/* Steps */}
      <ol className="flex items-center gap-2 mb-5">
        {steps.map((label, i) => (
          <li key={i} className="flex-1 flex items-center gap-2">
            <span
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i <= activeStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-xs leading-tight ${
                i === activeStep ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

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
          size="lg"
          className="w-full rounded-2xl h-14 text-base"
        >
          {uploading ? (
            <Loader2 size={20} className="mr-2 animate-spin" />
          ) : (
            <ImagePlus size={20} className="mr-2" />
          )}
          {isRu ? "Загрузить фото" : "Upload a photo"}
        </Button>
      )}

      {previewUrl && (
        <div className="space-y-4">
          <div className="relative">
            <img src={previewUrl} alt="" className="w-full rounded-2xl max-h-56 object-cover" />
            <button
              onClick={reset}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 border border-border flex items-center justify-center text-foreground hover:bg-background"
              aria-label="Remove"
            >
              <X size={16} />
            </button>
          </div>

          {analyzing && (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
              <Loader2 size={18} className="animate-spin text-primary" />
              {isRu ? "ИИ изучает фото..." : "AI is studying the photo..."}
            </div>
          )}

          {result && (
            <>
              {result.questions?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    {isRu ? "Выберите вопрос:" : "Pick a question:"}
                  </p>
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
                        className="w-full text-left text-base text-foreground bg-background border border-border hover:border-primary/40 hover:bg-primary/5 rounded-2xl px-4 py-3 transition-colors leading-snug"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground italic text-center pt-2 border-t border-border/50">
                {isRu
                  ? "ИИ опирается только на то, что видно на фото."
                  : "AI relies only on what's visible in the photo."}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoQuestionAssistant;