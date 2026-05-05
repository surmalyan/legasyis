import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, Mail, Share2, MessageCircle, Send, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { MEMORIAL_CATEGORIES, MEMORIAL_QUESTIONS, type MemorialCategory } from "@/lib/memorial-questions";

type CircleRole = Database["public"]["Enums"]["circle_role"];

type Props = {
  open: boolean;
  onClose: () => void;
  inviteCode: string;
  circleId: string;
  personName: string;
};

const InviteContributorModal = ({ open, onClose, inviteCode, circleId, personName }: Props) => {
  const { lang } = useI18n();
  const baseLink = `${window.location.origin}/memory-circle/join/${inviteCode}`;
  const [promptCategory, setPromptCategory] = useState<MemorialCategory | "">("");
  const link = promptCategory ? `${baseLink}?topic=${promptCategory}` : baseLink;
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CircleRole>("friend");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const cats = MEMORIAL_CATEGORIES[lang] || MEMORIAL_CATEGORIES.en;
  const promptCount = promptCategory
    ? MEMORIAL_QUESTIONS.filter((q) => q.category === promptCategory).length
    : 0;

  const inviteText = (() => {
    if (promptCategory) {
      const topic = cats[promptCategory].label.toLowerCase();
      return lang === "ru"
        ? `Помогите вспомнить ${personName}. Я подобрал(а) ${promptCount} наводящих вопросов на тему «${topic}», которые помогут углубиться в детали: ${link}`
        : `Help me remember ${personName}. I picked ${promptCount} guiding questions about "${topic}" to help recall the details: ${link}`;
    }
    return lang === "ru"
      ? `Я создаю Книгу Памяти о ${personName}. Помогите мне собрать воспоминания: ${link}`
      : `I'm creating a Book of Memory for ${personName}. Help me collect memories: ${link}`;
  })();

  const copyLink = () => {
    navigator.clipboard.writeText(promptCategory ? inviteText : link);
    setCopied(true);
    toast.success(lang === "ru" ? "Ссылка скопирована" : "Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: lang === "ru" ? "Книга Памяти" : "Book of Memory",
          text: inviteText,
          url: link,
        });
      } catch { /* cancelled */ }
    } else {
      copyLink();
    }
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, "_blank");
  };

  const openTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(inviteText)}`, "_blank");
  };

  const sendEmailInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error(lang === "ru" ? "Некорректный email" : "Invalid email");
      return;
    }
    setSending(true);
    const { error } = await supabase.rpc("create_circle_invitation", {
      _circle_id: circleId,
      _email: trimmed,
      _role: role,
      _message: message.trim() || null,
    });
    setSending(false);
    if (error) {
      toast.error(lang === "ru" ? "Не удалось отправить" : "Failed to send");
      return;
    }
    // Open mail client as a fallback so it actually goes out today
    const subject = encodeURIComponent(
      lang === "ru" ? `Книга Памяти о ${personName}` : `Book of Memory for ${personName}`
    );
    const body = encodeURIComponent(
      `${message.trim() ? message.trim() + "\n\n" : ""}${inviteText}`
    );
    window.location.href = `mailto:${trimmed}?subject=${subject}&body=${body}`;
    toast.success(lang === "ru" ? "Приглашение сохранено" : "Invitation saved");
    setEmail(""); setMessage("");
    onClose();
  };

  const roleOptions: { value: CircleRole; label: string }[] = [
    { value: "family", label: lang === "ru" ? "Семья" : "Family" },
    { value: "friend", label: lang === "ru" ? "Друг" : "Friend" },
    { value: "colleague", label: lang === "ru" ? "Коллега" : "Colleague" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif-display font-light text-xl">
            {lang === "ru" ? "Пригласить соавтора" : "Invite a contributor"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {lang === "ru"
              ? `Помогите близким сохранить воспоминания о ${personName}`
              : `Help loved ones preserve memories of ${personName}`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-2">
          <TabsList className="grid grid-cols-3 w-full rounded-xl">
            <TabsTrigger value="link" className="rounded-lg text-xs">
              <Share2 size={13} className="mr-1.5" />
              {lang === "ru" ? "Ссылка" : "Link"}
            </TabsTrigger>
            <TabsTrigger value="prompts" className="rounded-lg text-xs">
              <HelpCircle size={13} className="mr-1.5" />
              {lang === "ru" ? "Вопросы" : "Prompts"}
            </TabsTrigger>
            <TabsTrigger value="email" className="rounded-lg text-xs">
              <Mail size={13} className="mr-1.5" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* === LINK TAB === */}
          <TabsContent value="link" className="space-y-3 mt-4">
            <div className="bg-secondary/50 rounded-2xl p-3 text-[11px] font-mono text-muted-foreground break-all">
              {link}
            </div>

            <Button onClick={copyLink} variant="outline" className="w-full rounded-2xl">
              {copied ? <Check size={15} className="mr-2" /> : <Copy size={15} className="mr-2" />}
              {lang === "ru" ? "Скопировать ссылку" : "Copy link"}
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
          </TabsContent>

          {/* === PROMPTS TAB === */}
          <TabsContent value="prompts" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === "ru"
                ? `Выберите тему — родственник получит ссылку, которая сразу откроет наводящие вопросы. Это помогает вспомнить детали и углубиться в историю.`
                : `Pick a topic — the recipient gets a link that opens guiding questions right away, helping them recall details and dive deeper.`}
            </p>

            <div className="space-y-2">
              {(Object.entries(cats) as [MemorialCategory, { label: string; emoji: string }][]).map(
                ([key, { label, emoji }]) => {
                  const count = MEMORIAL_QUESTIONS.filter((q) => q.category === key).length;
                  const active = promptCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setPromptCategory(active ? "" : key)}
                      className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 border text-left transition-all ${
                        active
                          ? "bg-primary/5 border-primary"
                          : "bg-card border-border hover:border-primary/40"
                      }`}
                    >
                      <span className="text-xl">{emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {count} {lang === "ru" ? "вопросов" : "questions"}
                        </p>
                      </div>
                      {active && <Check size={16} className="text-primary" />}
                    </button>
                  );
                }
              )}
            </div>

            {promptCategory && (
              <>
                <div className="bg-secondary/50 rounded-2xl p-3 text-[11px] text-muted-foreground">
                  {inviteText}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={copyLink} variant="outline" className="rounded-2xl">
                    {copied ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                    <span className="text-xs">{lang === "ru" ? "Скопировать" : "Copy"}</span>
                  </Button>
                  <Button onClick={shareNative} variant="outline" className="rounded-2xl">
                    <Share2 size={14} className="mr-1.5" />
                    <span className="text-xs">{lang === "ru" ? "Поделиться" : "Share"}</span>
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={openWhatsApp} variant="secondary" className="rounded-2xl flex-col h-auto py-3 gap-1">
                    <MessageCircle size={16} className="text-green-600" />
                    <span className="text-[10px]">WhatsApp</span>
                  </Button>
                  <Button onClick={openTelegram} variant="secondary" className="rounded-2xl flex-col h-auto py-3 gap-1">
                    <Send size={16} className="text-blue-500" />
                    <span className="text-[10px]">Telegram</span>
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* === EMAIL TAB === */}
          <TabsContent value="email" className="space-y-3 mt-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={lang === "ru" ? "Email соавтора" : "Contributor's email"}
              className="rounded-xl"
            />

            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5">
                {lang === "ru" ? "Кто это?" : "Who are they?"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRole(opt.value)}
                    className={`rounded-xl py-2 text-xs font-medium transition-all ${
                      role === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                lang === "ru"
                  ? "Личное сообщение (необязательно)"
                  : "Personal message (optional)"
              }
              className="rounded-xl min-h-[80px] resize-none"
            />

            <Button
              onClick={sendEmailInvite}
              disabled={!email.trim() || sending}
              className="w-full rounded-2xl"
            >
              <Mail size={15} className="mr-2" />
              {sending
                ? (lang === "ru" ? "Отправка..." : "Sending...")
                : (lang === "ru" ? "Отправить приглашение" : "Send invitation")}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              {lang === "ru"
                ? "Откроется ваш почтовый клиент с готовым письмом"
                : "Your email client will open with a ready message"}
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InviteContributorModal;