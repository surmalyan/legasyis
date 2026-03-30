import { supabase } from "@/integrations/supabase/client";

// Re-export questions, chapters, labels from dedicated module
export { questionPool, chapterLabels, chapterOrder, getTodayQuestion, getRandomQuestion, depthLabels, depthDescriptions } from "./questions";
export type { MappedQuestion, QuestionDepth } from "./questions";

export interface DiaryEntry {
  id: string;
  date: string;
  question: string;
  answer: string;
  story: string;
  chapter?: string;
  audioUrl?: string;
}

// ── Supabase operations ──

export async function saveEntryToDb(entry: {
  question: string;
  original_text: string;
  ai_story: string;
  chapter?: string;
}): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");

  const { data, error } = await supabase
    .from("entries")
    .insert({
      user_id: user.id,
      question: entry.question,
      original_text: entry.original_text,
      ai_story: entry.ai_story,
      ...(entry.chapter ? { chapter: entry.chapter } : {}),
    } as any)
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function getEntriesFromDb(): Promise<DiaryEntry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    date: row.created_at,
    question: row.question,
    answer: row.original_text,
    story: row.ai_story,
    chapter: row.chapter || "reflections",
  }));
}

export async function deleteEntryFromDb(id: string): Promise<void> {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}

// ── Legacy localStorage helpers ──

const STORAGE_KEY = "diary-entries";

export function getEntries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: DiaryEntry): void {
  const entries = getEntries();
  entries.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function deleteEntry(id: string): void {
  const entries = getEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getEntryById(id: string): DiaryEntry | undefined {
  return getEntries().find((e) => e.id === id);
}
