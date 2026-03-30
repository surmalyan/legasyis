import { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  lang: "ru" | "en";
  userId: string;
  relationships: string[];
  onClose: () => void;
  onSent: () => void;
}

const InviteFamilyModal = ({ lang, userId, relationships, onClose, onSent }: Props) => {
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [sending, setSending] = useState(false);

  const t = {
    title: lang === "ru" ? "Пригласить родственника" : "Invite Family Member",
    email: lang === "ru" ? "Email родственника" : "Family member's email",
    relationship: lang === "ru" ? "Кем приходится вам" : "Their relationship to you",
    send: lang === "ru" ? "Отправить приглашение" : "Send Invitation",
    success: lang === "ru" ? "Приглашение отправлено!" : "Invitation sent!",
    error: lang === "ru" ? "Ошибка отправки" : "Failed to send",
  };

  const handleSend = async () => {
    if (!email.trim() || !relationship) return;
    setSending(true);
    try {
      const { error } = await supabase.from("family_connections" as any).insert({
        requester_id: userId,
        target_email: email.trim().toLowerCase(),
        relationship,
        status: "pending",
      } as any);
      if (error) throw error;
      toast.success(t.success);
      onSent();
      onClose();
    } catch {
      toast.error(t.error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.email}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t.relationship}</option>
          {relationships.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <button
          onClick={handleSend}
          disabled={sending || !email.trim() || !relationship}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium disabled:opacity-40"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> {t.send}</>}
        </button>
      </div>
    </div>
  );
};

export default InviteFamilyModal;
