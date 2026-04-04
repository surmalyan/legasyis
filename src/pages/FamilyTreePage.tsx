import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Plus, Loader2, UserPlus, Link2, Search } from "lucide-react";
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
  user_id?: string;
}

interface FamilyConnection {
  id: string;
  requester_id: string;
  target_email: string;
  target_user_id: string | null;
  relationship: string;
  status: string;
}

interface ConnectedTree {
  userId: string;
  email: string;
  relationship: string;
  members: FamilyMember[];
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
  const [connectedTrees, setConnectedTrees] = useState<ConnectedTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ user_id: string; full_name: string; username: string; avatar_url: string | null }>>([]);
  const [searching, setSearching] = useState(false);

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
    linkedTree: lang === "ru" ? "Древо:" : "Tree:",
    searchPlaceholder: lang === "ru" ? "Поиск по логину..." : "Search by username...",
    noResults: lang === "ru" ? "Не найдено" : "No results",
    sendRequest: lang === "ru" ? "Отправить запрос" : "Send request",
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    const [membersRes, sentRes, inRes] = await Promise.all([
      supabase.from("family_members").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("family_connections").select("*").eq("requester_id", user.id),
      supabase.from("family_connections").select("*").eq("target_user_id", user.id),
    ]);
    setMembers((membersRes.data as FamilyMember[]) || []);
    setConnections((sentRes.data as unknown as FamilyConnection[]) || []);
    setIncoming((inRes.data as unknown as FamilyConnection[]) || []);

    // Load connected users' family trees
    const allConns = [...((sentRes.data as unknown as FamilyConnection[]) || []), ...((inRes.data as unknown as FamilyConnection[]) || [])];
    const confirmed = allConns.filter(c => c.status === "confirmed");
    const trees: ConnectedTree[] = [];

    for (const conn of confirmed) {
      const otherUserId = conn.requester_id === user.id ? conn.target_user_id : conn.requester_id;
      if (!otherUserId || trees.some(t => t.userId === otherUserId)) continue;

      const { data: otherMembers } = await supabase
        .from("family_members")
        .select("*")
        .eq("user_id", otherUserId)
        .order("created_at");

      if (otherMembers && otherMembers.length > 0) {
        trees.push({
          userId: otherUserId,
          email: conn.requester_id === user.id ? conn.target_email : "linked",
          relationship: conn.relationship,
          members: otherMembers as FamilyMember[],
        });
      }
    }
    setConnectedTrees(trees);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Match incoming connections by email
  useEffect(() => {
    if (!user?.email) return;
    const matchEmail = async () => {
      const { data } = await supabase
        .from("family_connections")
        .select("*")
        .eq("target_email", user.email!.toLowerCase())
        .eq("status", "pending")
        .is("target_user_id", null);
      if (data && data.length > 0) {
        for (const conn of data as any[]) {
          await supabase
            .from("family_connections")
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
    await supabase.from("family_connections").update({ status: "confirmed" }).eq("id", id);
    toast.success(t.accepted);
    loadData();
  };

  const handleReject = async (id: string) => {
    await supabase.from("family_connections").update({ status: "rejected" }).eq("id", id);
    toast.info(t.rejected);
    loadData();
  };

  const handleDeleteConnection = async (id: string) => {
    await supabase.from("family_connections").delete().eq("id", id);
    loadData();
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, username")
      .ilike("username", `%${query.toLowerCase()}%`)
      .neq("user_id", user!.id)
      .limit(10);
    setSearchResults((data as any[])?.map(d => ({
      user_id: d.user_id, full_name: d.full_name || "", username: d.username || "",
      avatar_url: d.avatar_url,
    })) || []);
    setSearching(false);
  };

  const handleQuickInvite = async (targetUserId: string) => {
    // Check if connection already exists
    const existing = [...connections, ...incoming].find(c =>
      (c.requester_id === user!.id && c.target_user_id === targetUserId) ||
      (c.target_user_id === user!.id && c.requester_id === targetUserId)
    );
    if (existing) {
      toast.info(lang === "ru" ? "Запрос уже отправлен" : "Request already sent");
      return;
    }
    // Get target email from profiles — we need it for family_connections
    const { error } = await supabase.from("family_connections").insert({
      requester_id: user!.id,
      target_email: "via-username",
      target_user_id: targetUserId,
      relationship: lang === "ru" ? "Родственник" : "Relative",
      status: "pending",
    });
    if (error) { toast.error(lang === "ru" ? "Ошибка" : "Error"); return; }
    toast.success(lang === "ru" ? "Запрос отправлен!" : "Request sent!");
    setSearchQuery("");
    setSearchResults([]);
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

  // Render a connected user's tree (read-only)
  const renderConnectedTree = (treeMembers: FamilyMember[]) => {
    const treeRoots = treeMembers.filter(m => !m.parent_member_id);
    const getTreeChildren = (parentId: string) => treeMembers.filter(m => m.parent_member_id === parentId);
    const treeOrphans = treeMembers.filter(m => m.parent_member_id && !treeMembers.find(p => p.id === m.parent_member_id));

    const renderLevel = (parents: FamilyMember[]): React.ReactNode => {
      if (parents.length === 0) return null;
      return (
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-4">
            {parents.map(member => (
              <div key={member.id} className="flex flex-col items-center">
                <FamilyTreeNode
                  name={member.name}
                  relationship={member.relationship}
                  birthYear={member.birth_year}
                  deathYear={member.death_year}
                  notes={member.notes}
                  status="confirmed"
                />
                {getTreeChildren(member.id).length > 0 && (
                  <>
                    <div className="w-px h-6 bg-border" />
                    {renderLevel(getTreeChildren(member.id))}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <>
        {treeRoots.length > 0 && renderLevel(treeRoots)}
        {treeOrphans.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4">
            {treeOrphans.map(m => (
              <FamilyTreeNode key={m.id} name={m.name} relationship={m.relationship}
                birthYear={m.birth_year} deathYear={m.death_year} notes={m.notes} status="confirmed" />
            ))}
          </div>
        )}
      </>
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
          {/* Search by username */}
          <div className="mb-4 relative">
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
              <Search size={16} className="text-muted-foreground flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {searching && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                {searchResults.map(r => (
                  <div key={r.user_id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserPlus size={14} className="text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.full_name || r.username}</p>
                      <p className="text-xs text-muted-foreground">@{r.username}</p>
                    </div>
                    <button
                      onClick={() => handleQuickInvite(r.user_id)}
                      className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium hover:bg-primary/20 transition-colors"
                    >
                      {t.sendRequest}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-xl p-3 text-center text-xs text-muted-foreground">
                {t.noResults}
              </div>
            )}
          </div>

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

                {/* Connected users' trees */}
                {connectedTrees.map(tree => (
                  <div key={tree.userId} className="mt-4 border-t border-border pt-6">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Link2 size={14} /> {t.linkedTree} {tree.email} ({tree.relationship})
                    </h3>
                    <div className="flex flex-col items-center gap-4">
                      {renderConnectedTree(tree.members)}
                    </div>
                  </div>
                ))}

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
