import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const NotificationsBell = ({ className = "" }: { className?: string }) => {
  const { user } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = items.filter((n) => !n.read_at).length;

  useEffect(() => {
    if (!user) return;
    load();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const load = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data as Notification[]) || []);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null)
      .eq("user_id", user.id);
    load();
  };

  const handleClick = async (n: Notification) => {
    if (!n.read_at) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
    }
    setOpen(false);
    if (n.link) navigate(n.link);
    load();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await supabase.from("notifications").delete().eq("id", id);
    load();
  };

  const localizeTitle = (n: Notification): string => {
    if (lang !== "ru") return n.title;
    const map: Record<string, string> = {
      member_joined: "Новый соавтор",
      memory_added: "Новое воспоминание",
      reminder: "Напоминание",
    };
    return map[n.type] || n.title;
  };

  const localizeBody = (n: Notification): string | null => {
    if (!n.body || lang !== "ru") return n.body;
    return n.body
      .replace(" joined the Book of Memory for ", " присоединился к Книге Памяти для ")
      .replace(" added a memory about ", " добавил воспоминание о ")
      .replace("A contributor", "Соавтор")
      .replace("Someone", "Кто-то")
      .replace("Your memories about ", "Ваши воспоминания о ")
      .replace(" are waiting. Even one story would mean a lot.", " ждут вас. Даже одна история будет очень важна.");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`relative w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${className}`}
          aria-label={lang === "ru" ? "Уведомления" : "Notifications"}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[340px] max-w-[calc(100vw-32px)] p-0 rounded-2xl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">
            {lang === "ru" ? "Уведомления" : "Notifications"}
          </p>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <Check size={12} />
              {lang === "ru" ? "Прочитать все" : "Mark all read"}
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell size={28} className="mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">
                {lang === "ru" ? "Пока тихо здесь" : "Nothing here yet"}
              </p>
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-accent/50 transition-colors flex gap-3 group ${
                  !n.read_at ? "bg-primary/5" : ""
                }`}
              >
                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!n.read_at ? "bg-primary" : "bg-transparent"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{localizeTitle(n)}</p>
                  {n.body && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{localizeBody(n)}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {new Date(n.created_at).toLocaleString(lang === "ru" ? "ru-RU" : "en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;