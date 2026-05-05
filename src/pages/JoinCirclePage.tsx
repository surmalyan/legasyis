import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import BackgroundPattern from "@/components/BackgroundPattern";
import StaticLogo from "@/components/StaticLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type CircleRole = Database["public"]["Enums"]["circle_role"];

const JoinCirclePage = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic");
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [circle, setCircle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [roleLabel, setRoleLabel] = useState<CircleRole>("friend");
  const [joining, setJoining] = useState(false);

  const roles: { value: CircleRole; label: string }[] = [
    { value: "family", label: lang === "ru" ? "Семья" : "Family" },
    { value: "friend", label: lang === "ru" ? "Друг" : "Friend" },
    { value: "colleague", label: lang === "ru" ? "Коллега" : "Colleague" },
  ];

  useEffect(() => {
    if (code) loadCircle();
  }, [code]);

  const loadCircle = async () => {
    const { data } = await supabase
      .from("memory_circles")
      .select("*")
      .eq("invite_code", code!)
      .maybeSingle();
    setCircle(data);
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user || !circle) return;
    setJoining(true);
    const { error } = await supabase.from("circle_members").insert({
      circle_id: circle.id,
      user_id: user.id,
      display_name: displayName.trim() || null,
      role_label: roleLabel,
      status: "active",
    });
    const dest = `/memory-circle/${circle.id}${topic ? `?topic=${topic}` : ""}`;
    if (error?.code === "23505") {
      toast.info(lang === "ru" ? "Вы уже участник" : "Already a member");
      navigate(dest);
    } else if (error) {
      toast.error(lang === "ru" ? "Ошибка" : "Error");
    } else {
      toast.success(lang === "ru" ? "Вы присоединились!" : "You joined!");
      navigate(dest);
    }
    setJoining(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">...</p>
    </div>;
  }

  if (!circle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <p className="text-muted-foreground mb-4">{lang === "ru" ? "Круг не найден" : "Circle not found"}</p>
        <Button onClick={() => navigate("/")} variant="outline">{lang === "ru" ? "На главную" : "Go home"}</Button>
      </div>
    );
  }

  if (!user) {
    navigate(`/auth?redirect=/memory-circle/join/${code}${topic ? `?topic=${topic}` : ""}`);
    return null;
  }

  const years = [circle.person_birth_year, circle.person_death_year].filter(Boolean).join(" – ");

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <BackgroundPattern />
      <header className="flex items-center gap-3 px-6 pt-14 pb-4 relative z-10">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <StaticLogo size={32} />
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-8 relative z-10">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            <Heart size={28} className="text-muted-foreground" />
          </div>

          <p className="text-xs text-muted-foreground mb-2">
            {lang === "ru" ? "Вас пригласили в круг памяти" : "You've been invited to a memory circle"}
          </p>

          <h2 className="text-xl font-serif-display font-light text-foreground mb-1">{circle.person_name}</h2>
          {years && <p className="text-sm text-muted-foreground">{years}</p>}
          {circle.description && <p className="text-xs text-muted-foreground mt-2">{circle.description}</p>}

          <div className="mt-8 space-y-4 text-left">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder={lang === "ru" ? "Ваше имя (видно участникам)" : "Your name (visible to members)"}
              className="rounded-xl" />

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {lang === "ru" ? "Кем вы приходитесь" : "Your relationship"}
              </label>
              <div className="flex gap-2">
                {roles.map((r) => (
                  <button key={r.value} onClick={() => setRoleLabel(r.value)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      roleLabel === r.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-accent"
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleJoin} disabled={joining} className="w-full rounded-2xl py-5 text-base mt-4" size="lg">
              {lang === "ru" ? "Присоединиться" : "Join Circle"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JoinCirclePage;
