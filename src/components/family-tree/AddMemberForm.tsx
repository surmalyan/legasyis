import { useState } from "react";
import { GitBranch, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
}

interface Props {
  lang: "ru" | "en";
  userId: string;
  members: FamilyMember[];
  relationships: string[];
  onClose: () => void;
  onAdded: () => void;
}

const AddMemberForm = ({ lang, userId, members, relationships, onClose, onAdded }: Props) => {
  const [form, setForm] = useState({
    name: "", relationship: "", birth_year: "", death_year: "", parent_member_id: "", notes: "", genetic_conditions: "",
  });
  const [saving, setSaving] = useState(false);

  const t = {
    add: lang === "ru" ? "Добавить члена семьи" : "Add Family Member",
    name: lang === "ru" ? "Имя" : "Name",
    relationship: lang === "ru" ? "Кем приходится" : "Relationship",
    birthYear: lang === "ru" ? "Год рождения" : "Birth Year",
    deathYear: lang === "ru" ? "Год смерти" : "Death Year",
    none: lang === "ru" ? "Нет (корень)" : "None (root)",
    notes: lang === "ru" ? "Заметки" : "Notes",
    save: lang === "ru" ? "Сохранить" : "Save",
    cancel: lang === "ru" ? "Отмена" : "Cancel",
    genetic: lang === "ru" ? "Генетические заболевания" : "Genetic Conditions",
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.relationship) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("family_members").insert({
        user_id: userId,
        name: form.name.trim(),
        relationship: form.relationship,
        birth_year: form.birth_year ? parseInt(form.birth_year) : null,
        death_year: form.death_year ? parseInt(form.death_year) : null,
        parent_member_id: form.parent_member_id || null,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
      toast.success(lang === "ru" ? "Добавлено!" : "Added!");
      onAdded();
      onClose();
    } catch {
      toast.error(lang === "ru" ? "Ошибка" : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <GitBranch size={18} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{t.add}</h3>
      </div>

      <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder={t.name} maxLength={100}
        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />

      <select value={form.relationship} onChange={(e) => setForm(f => ({ ...f, relationship: e.target.value }))}
        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
        <option value="">{t.relationship}</option>
        {relationships.map(r => <option key={r} value={r}>{r}</option>)}
      </select>

      <div className="flex gap-3">
        <input type="number" value={form.birth_year} onChange={(e) => setForm(f => ({ ...f, birth_year: e.target.value }))}
          placeholder={t.birthYear}
          className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        <input type="number" value={form.death_year} onChange={(e) => setForm(f => ({ ...f, death_year: e.target.value }))}
          placeholder={t.deathYear}
          className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {members.length > 0 && (
        <select value={form.parent_member_id} onChange={(e) => setForm(f => ({ ...f, parent_member_id: e.target.value }))}
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">{t.none}</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>)}
        </select>
      )}

      <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
        placeholder={t.notes} rows={2} maxLength={500}
        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />

      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 bg-muted text-muted-foreground rounded-xl py-3 text-sm font-medium">
          {t.cancel}
        </button>
        <button onClick={handleAdd} disabled={saving || !form.name.trim() || !form.relationship}
          className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium disabled:opacity-40">
          {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : t.save}
        </button>
      </div>
    </div>
  );
};

export default AddMemberForm;
