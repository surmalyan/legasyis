import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Camera, Loader2, User } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentUrl?: string;
  onUploaded: (url: string) => void;
  lang: "ru" | "en";
}

const AvatarUpload = ({ currentUrl, onUploaded, lang }: AvatarUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error(lang === "ru" ? "Выберите изображение" : "Please select an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang === "ru" ? "Максимум 5 МБ" : "Max 5 MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      onUploaded(data.publicUrl + "?t=" + Date.now());
      toast.success(lang === "ru" ? "Фото загружено!" : "Photo uploaded!");
    } catch {
      toast.error(lang === "ru" ? "Ошибка загрузки" : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative w-24 h-24 rounded-full bg-muted border-2 border-border overflow-hidden group transition-all hover:border-primary"
      >
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={36} className="text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? (
            <Loader2 size={24} className="text-background animate-spin" />
          ) : (
            <Camera size={24} className="text-background" />
          )}
        </div>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      <span className="text-xs text-muted-foreground">
        {lang === "ru" ? "Нажмите для загрузки фото" : "Click to upload photo"}
      </span>
    </div>
  );
};

export default AvatarUpload;
