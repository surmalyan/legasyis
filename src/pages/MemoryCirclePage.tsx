import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import BackgroundPattern from "@/components/BackgroundPattern";
import StaticLogo from "@/components/StaticLogo";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, ChevronLeft, Link2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

type Circle = {
  id: string;
  person_name: string;
  person_birth_year: number | null;
  person_death_year: number | null;
  description: string | null;
  invite_code: string;
  created_at: string;
  creator_id: string;
};

const MemoryCirclePage = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create form
  const [personName, setPersonName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [deathYear, setDeathYear] = useState("");
  const [description, setDescription] = useState("");

  // Join form
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (user) loadCircles();
  }, [user]);

  const loadCircles = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("memory_circles")
      .select("*")
      .order("created_at", { ascending: false });
    setCircles((data as Circle[]) || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!personName.trim() || !user) return;
    const { error } = await supabase.from("memory_circles").insert({
      creator_id: user.id,
      person_name: personName.trim(),
      person_birth_year: birthYear ? parseInt(birthYear) : null,
      person_death_year: deathYear ? parseInt(deathYear) : null,
      description: description.trim() || null,
    });
    if (error) {
      toast.error(lang === "ru" ? "Ошибка создания" : "Failed to create");
      return;
    }
    toast.success(lang === "ru" ? "Круг памяти создан" : "Memory Circle created");
    setShowCreate(false);
    setPersonName(""); setBirthYear(""); setDeathYear(""); setDescription("");
    loadCircles();
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !user) return;
    const { data: circle } = await supabase
      .from("memory_circles")
      .select("id")
      .eq("invite_code", joinCode.trim())
      .maybeSingle();
    if (!circle) {
      toast.error(lang === "ru" ? "Круг не найден" : "Circle not found");
      return;
    }
    const { error } = await supabase.from("circle_members").insert({
      circle_id: circle.id,
      user_id: user.id,
      status: "active",
    });
    if (error?.code === "23505") {
      toast.info(lang === "ru" ? "Вы уже участник" : "Already a member");
    } else if (error) {
      toast.error(lang === "ru" ? "Ошибка" : "Error joining");
    } else {
      toast.success(lang === "ru" ? "Вы присоединились!" : "You joined!");
    }
    setShowJoin(false);
    setJoinCode("");
    loadCircles();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <BackgroundPattern />
      <header className="flex items-center gap-3 px-6 pt-14 pb-4 relative z-10">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={24} />
        </button>
        <StaticLogo size={32} />
        <h1 className="text-lg font-semibold text-foreground">
          {lang === "ru" ? "Круги памяти" : "Memory Circles"}
        </h1>
      </header>

      <main className="flex-1 px-6 pb-28 relative z-10">
        <div className="max-w-md mx-auto space-y-4">
          {/* Action buttons */}
          <div className="flex gap-3">
            <Button onClick={() => { setShowCreate(true); setShowJoin(false); }} className="flex-1 rounded-2xl" size="lg">
              <Plus size={18} className="mr-2" />
              {lang === "ru" ? "Создать" : "Create"}
            </Button>
            <Button onClick={() => { setShowJoin(true); setShowCreate(false); }} variant="secondary" className="flex-1 rounded-2xl" size="lg">
              <Link2 size={18} className="mr-2" />
              {lang === "ru" ? "Присоединиться" : "Join"}
            </Button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-fade-in">
              <h3 className="font-semibold text-foreground">
                {lang === "ru" ? "Новый круг памяти" : "New Memory Circle"}
              </h3>
              <Input value={personName} onChange={(e) => setPersonName(e.target.value)}
                placeholder={lang === "ru" ? "Имя человека *" : "Person's name *"} className="rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Input value={birthYear} onChange={(e) => setBirthYear(e.target.value)}
                  placeholder={lang === "ru" ? "Год рождения" : "Birth year"} type="number" className="rounded-xl" />
                <Input value={deathYear} onChange={(e) => setDeathYear(e.target.value)}
                  placeholder={lang === "ru" ? "Год ухода" : "Year of passing"} type="number" className="rounded-xl" />
              </div>
              <Input value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder={lang === "ru" ? "Краткое описание" : "Brief description"} className="rounded-xl" />
              <Button onClick={handleCreate} disabled={!personName.trim()} className="w-full rounded-2xl">
                {lang === "ru" ? "Создать круг" : "Create Circle"}
              </Button>
            </div>
          )}

          {/* Join form */}
          {showJoin && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-fade-in">
              <h3 className="font-semibold text-foreground">
                {lang === "ru" ? "Присоединиться по коду" : "Join by code"}
              </h3>
              <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                placeholder={lang === "ru" ? "Код приглашения" : "Invite code"} className="rounded-xl" />
              <Button onClick={handleJoin} disabled={!joinCode.trim()} className="w-full rounded-2xl">
                {lang === "ru" ? "Присоединиться" : "Join"}
              </Button>
            </div>
          )}

          {/* Circles list */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {lang === "ru" ? "Загрузка..." : "Loading..."}
            </div>
          ) : circles.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-sm">
                {lang === "ru" ? "У вас пока нет кругов памяти" : "You don't have any memory circles yet"}
              </p>
            </div>
          ) : (
            circles.map((circle) => (
              <CircleCard key={circle.id} circle={circle} lang={lang} isCreator={circle.creator_id === user?.id}
                onClick={() => navigate(`/memory-circle/${circle.id}`)} />
            ))
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

const CircleCard = ({ circle, lang, isCreator, onClick }: {
  circle: Circle; lang: string; isCreator: boolean; onClick: () => void;
}) => {
  const years = [circle.person_birth_year, circle.person_death_year].filter(Boolean).join(" – ");
  return (
    <button onClick={onClick}
      className="w-full bg-card border border-border rounded-2xl p-5 text-left hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.98]">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-foreground">{circle.person_name}</p>
          {years && <p className="text-xs text-muted-foreground mt-0.5">{years}</p>}
          {circle.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{circle.description}</p>}
        </div>
        <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
          {isCreator ? (lang === "ru" ? "Создатель" : "Creator") : (lang === "ru" ? "Участник" : "Member")}
        </span>
      </div>
    </button>
  );
};

export default MemoryCirclePage;
