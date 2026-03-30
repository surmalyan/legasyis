import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Plus, Loader2, UserPlus, Link2 } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import FamilyTreeNode from "@/components/family-tree/FamilyTreeNode";
import AddMemberForm from "@/components/family-tree/AddMemberForm";
import InviteFamilyModal from "@/components/family-tree/InviteFamilyModal";
import ZoomPanCanvas from "@/components/family-tree/ZoomPanCanvas";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birth_year: number | null;
  death_year: number | null;
  parent_member_id: string | null;
  notes: string | null;
}

interface FamilyConnection {
  id: string;
  requester_id: string;
  target_email: string;
  target_user_id: string | null;
  relationship: string;
  status: string;
}

const RELATIONSHIPS = {
  ru: [
    "Я", "Отец", "Мать", "Дедушка", "Бабушка",
    "Брат", "Сестра", "Сын", "Дочь", "Супруг(а)",
    "Дядя", "Тётя", "Двоюродный брат/сестра", "Другое"
  ],
  en: [
    "Me", "Father", "Mother", "Grandfather", "Grandmother",
    "Brother", "Sister", "Son", "Daughter", "Spouse",
    "Uncle", "Aunt", "Cousin", "Other"
  ],
};

const FamilyTreePage = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [connections, setConnections] = useState<FamilyConnection[]>([]);
  const [incoming, setIncoming] = useState<FamilyConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const t = {
    title: lang === "ru" ? "Семейное древо" : "Family Tree",
    empty: lang === "ru" ? "Начните строить своё семейное древо" : "Start building your family tree",
    addMember: lang === "ru" ? "Добавить" : "Add Member",
    invite: lang === "ru" ? "Связать аккаунт" : "Link Account",
    pendingIn: lang === "ru" ? "Входящие запросы" : "Incoming Requests",
    pendingSent: lang === "ru" ? "Отправленные" : "Sent Requests",
    confirmed: lang === "ru" ? "Подтверждённые связи" : "Confirmed Links",
    accepted: lang === "ru" ? "Связь подтверждена!" : "Connection confirmed!",
    rejected: lang === "ru" ? "Связь отклонена" : "Connection rejected",
    wantsConnect: lang === "ru" ? "хочет связать аккаунты как" : "wants to link accounts as",
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    const [membersRes, sentRes, inRes] = await Promise.all([
      supabase.from("family_members").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("family_connections" as any).select("*").eq("requester_id", user.id),
      supabase.from("family_connections" as any).select("*").eq("target_user_id", user.id),
    ]);
    setMembers((membersRes.data as FamilyMember[]) || []);
    setConnections((sentRes.data as unknown as FamilyConnection[]) || []);
    setIncoming((inRes.data as unknown as FamilyConnection[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if current user has incoming connections by email
  useEffect(() => {
    if (!user?.email) return;
    const matchEmail = async () => {
      const { data } = await supabase
        .from("family_connections" as any)
        .select("*")
        .eq("target_email", user.email!.toLowerCase())
        .eq("status", "pending")
        .is("target_user_id", null);
      if (data && data.length > 0) {
        // Auto-assign target_user_id
        for (const conn of data as any[]) {
          await supabase
            .from("family_connections" as any)
            .update({ target_user_id: user.id } as any)
            .eq("id", conn.id);
        }
        loadData();
      }
    };
    matchEmail();
  }, [user, loadData]);

  const handleDelete = async (id: string) => {
    await supabase.from("family_members").delete().eq("id", id);
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleAccept = async (id: string) => {
    await supabase.from("family_connections" as any).update({ status: "confirmed" } as any).eq("id", id);
    toast.success(t.accepted);
    loadData();
  };

  const handleReject = async (id: string) => {
    await supabase.from("family_connections" as any).update({ status: "rejected" } as any).eq("id", id);
    toast.info(t.rejected);
    loadData();
  };

  const handleDeleteConnection = async (id: string) => {
    await supabase.from("family_connections" as any).delete().eq("id", id);
    loadData();
  };

  // Build tree layers
  const roots = members.filter(m => !m.parent_member_id);
  const getChildren = (parentId: string) => members.filter(m => m.parent_member_id === parentId);
  const orphans = members.filter(m => m.parent_member_id && !members.find(p => p.id === m.parent_member_id));

  const pendingIncoming = incoming.filter(c => c.status === "pending");
  const confirmedConnections = [...connections, ...incoming].filter(c => c.status === "confirmed");
  const pendingSent = connections.filter(c => c.status === "pending");

  // Recursive tree renderer as visual grid
  const renderTreeLevel = (parentMembers: FamilyMember[], depth: number = 0) => {
    if (parentMembers.length === 0) return null;
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-4">
          {parentMembers.map(member => (
            <div key={member.id} className="flex flex-col items-center">
              <FamilyTreeNode
                name={member.name}
                relationship={member.relationship}
                birthYear={member.birth_year}
                deathYear={member.death_year}
                notes={member.notes}
                isCenter={member.relationship === "Я" || member.relationship === "Me"}
                onDelete={() => handleDelete(member.id)}
              />
              {getChildren(member.id).length > 0 && (
                <>
                  <div className="w-px h-6 bg-border" />
                  <div className="relative">
                    {getChildren(member.id).length > 1 && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border"
                        style={{ width: `${Math.min(getChildren(member.id).length * 160, 400)}px` }} />
                    )}
                    {renderTreeLevel(getChildren(member.id), depth + 1)}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center gap-3 px-4 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-foreground font-serif-display flex-1">{t.title}</h1>
        <button onClick={() => setShowInvite(true)}
          className="p-2 rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition-colors mr-1"
          title={t.invite}>
          <Link2 size={18} />
        </button>
        <button onClick={() => setShowForm(true)}
          className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          title={t.addMember}>
          <Plus size={20} />
        </button>
      </header>

      <main className="flex-1 flex flex-col px-4 pb-28">
        <div className="max-w-2xl mx-auto w-full">
          {/* Add form */}
          {showForm && (
            <AddMemberForm
              lang={lang}
              userId={user!.id}
              members={members}
              relationships={RELATIONSHIPS[lang]}
              onClose={() => setShowForm(false)}
              onAdded={loadData}
            />
          )}

          {/* Incoming requests */}
          {pendingIncoming.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <UserPlus size={14} /> {t.pendingIn}
              </h3>
              <div className="flex flex-wrap gap-3">
                {pendingIncoming.map(conn => (
                  <div key={conn.id} className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 min-w-[200px]">
                    <p className="text-xs text-foreground font-medium">{conn.target_email}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {t.wantsConnect} <span className="font-semibold">{conn.relationship}</span>
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleAccept(conn.id)}
                        className="flex-1 text-[11px] py-1.5 rounded-lg bg-green-500/10 text-green-600 font-medium hover:bg-green-500/20">
                        ✓
                      </button>
                      <button onClick={() => handleReject(conn.id)}
                        className="flex-1 text-[11px] py-1.5 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Tree */}
          {members.length === 0 && confirmedConnections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <UserPlus size={32} className="text-primary" />
              </div>
              <p className="text-muted-foreground text-sm mb-2">{t.empty}</p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium">
                  <Plus size={16} /> {t.addMember}
                </button>
                <button onClick={() => setShowInvite(true)}
                  className="flex items-center gap-2 bg-accent text-accent-foreground rounded-xl px-4 py-2.5 text-sm font-medium">
                  <Link2 size={16} /> {t.invite}
                </button>
              </div>
            </div>
          ) : (
            <ZoomPanCanvas>
              <div className="flex flex-col items-center gap-6 min-w-max">
                {/* Main tree */}
                {roots.length > 0 && renderTreeLevel(roots)}

                {/* Orphans */}
                {orphans.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap justify-center gap-4">
                      {orphans.map(m => (
                        <FamilyTreeNode key={m.id} name={m.name} relationship={m.relationship}
                          birthYear={m.birth_year} deathYear={m.death_year} notes={m.notes}
                          onDelete={() => handleDelete(m.id)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmed connections */}
                {confirmedConnections.length > 0 && (
                  <div className="mt-4 border-t border-border pt-6">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Link2 size={14} /> {t.confirmed}
                    </h3>
                    <div className="flex flex-wrap justify-center gap-4">
                      {confirmedConnections.map(conn => (
                        <FamilyTreeNode key={conn.id} name={conn.target_email}
                          relationship={conn.relationship} status="confirmed"
                          onDelete={() => handleDeleteConnection(conn.id)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sent pending */}
                {pendingSent.length > 0 && (
                  <div className="mt-4 border-t border-border pt-6">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <UserPlus size={14} /> {t.pendingSent}
                    </h3>
                    <div className="flex flex-wrap justify-center gap-4">
                      {pendingSent.map(conn => (
                        <FamilyTreeNode key={conn.id} name={conn.target_email}
                          relationship={conn.relationship} status="pending"
                          onDelete={() => handleDeleteConnection(conn.id)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ZoomPanCanvas>
          )}
        </div>
      </main>

      {/* Invite modal */}
      {showInvite && (
        <InviteFamilyModal
          lang={lang}
          userId={user!.id}
          relationships={RELATIONSHIPS[lang]}
          onClose={() => setShowInvite(false)}
          onSent={loadData}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default FamilyTreePage;
