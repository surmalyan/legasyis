import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Plus, Trash2, Loader2, Users, GitBranch } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birth_year: number | null;
  death_year: number | null;
  parent_member_id: string | null;
  notes: string | null;
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    relationship: "",
    birth_year: "",
    death_year: "",
    parent_member_id: "",
    notes: "",
  });

  const t = {
    title: lang === "ru" ? "Семейное древо" : "Family Tree",
    add: lang === "ru" ? "Добавить члена семьи" : "Add Family Member",
    name: lang === "ru" ? "Имя" : "Name",
    relationship: lang === "ru" ? "Кем приходится" : "Relationship",
    birthYear: lang === "ru" ? "Год рождения" : "Birth Year",
    deathYear: lang === "ru" ? "Год смерти (если)" : "Death Year (if applicable)",
    parent: lang === "ru" ? "Родитель в древе" : "Parent in Tree",
    notes: lang === "ru" ? "Заметки" : "Notes",
    save: lang === "ru" ? "Сохранить" : "Save",
    cancel: lang === "ru" ? "Отмена" : "Cancel",
    empty: lang === "ru" ? "Добавьте первого члена семьи" : "Add your first family member",
    none: lang === "ru" ? "Нет (корень)" : "None (root)",
  };

  useEffect(() => {
    if (!user) return;
    loadMembers();
  }, [user]);

  const loadMembers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("family_members")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");
    setMembers((data as FamilyMember[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!user || !form.name.trim() || !form.relationship) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("family_members").insert({
        user_id: user.id,
        name: form.name.trim(),
        relationship: form.relationship,
        birth_year: form.birth_year ? parseInt(form.birth_year) : null,
        death_year: form.death_year ? parseInt(form.death_year) : null,
        parent_member_id: form.parent_member_id || null,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
      setForm({ name: "", relationship: "", birth_year: "", death_year: "", parent_member_id: "", notes: "" });
      setShowForm(false);
      await loadMembers();
      toast.success(lang === "ru" ? "Добавлено!" : "Added!");
    } catch {
      toast.error(lang === "ru" ? "Ошибка" : "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from("family_members").delete().eq("id", id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch {
      toast.error(lang === "ru" ? "Ошибка удаления" : "Delete failed");
    }
  };

  // Build tree structure
  const roots = members.filter((m) => !m.parent_member_id);
  const getChildren = (parentId: string) => members.filter((m) => m.parent_member_id === parentId);

  const renderMember = (member: FamilyMember, depth: number = 0) => (
    <div key={member.id} style={{ marginLeft: depth * 24 }}>
      <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4 mb-2 group">
        {depth > 0 && (
          <div className="w-4 h-px bg-border" />
        )}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Users size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
          <p className="text-xs text-muted-foreground">
            {member.relationship}
            {member.birth_year && ` · ${member.birth_year}`}
            {member.death_year && ` – ${member.death_year}`}
          </p>
          {member.notes && (
            <p className="text-xs text-muted-foreground mt-1 italic">{member.notes}</p>
          )}
        </div>
        <button
          onClick={() => handleDelete(member.id)}
          className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {getChildren(member.id).map((child) => renderMember(child, depth + 1))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center gap-3 px-6 pt-14 pb-6">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-foreground font-serif-display flex-1">{t.title}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus size={20} />
        </button>
      </header>

      <main className="flex-1 px-6 pb-28 max-w-md mx-auto w-full">
        {/* Add form */}
        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch size={18} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{t.add}</h3>
            </div>

            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t.name}
              maxLength={100}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <select
              value={form.relationship}
              onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t.relationship}</option>
              {RELATIONSHIPS[lang].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <input
                type="number"
                value={form.birth_year}
                onChange={(e) => setForm((f) => ({ ...f, birth_year: e.target.value }))}
                placeholder={t.birthYear}
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="number"
                value={form.death_year}
                onChange={(e) => setForm((f) => ({ ...f, death_year: e.target.value }))}
                placeholder={t.deathYear}
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {members.length > 0 && (
              <select
                value={form.parent_member_id}
                onChange={(e) => setForm((f) => ({ ...f, parent_member_id: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t.none}</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>
                ))}
              </select>
            )}

            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder={t.notes}
              rows={2}
              maxLength={500}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-muted text-muted-foreground rounded-xl py-3 text-sm font-medium"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !form.name.trim() || !form.relationship}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium disabled:opacity-40"
              >
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : t.save}
              </button>
            </div>
          </div>
        )}

        {/* Tree */}
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <GitBranch size={28} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">{t.empty}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {roots.map((m) => renderMember(m))}
            {/* Orphans (parent deleted) */}
            {members
              .filter((m) => m.parent_member_id && !members.find((p) => p.id === m.parent_member_id))
              .map((m) => renderMember(m))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default FamilyTreePage;
