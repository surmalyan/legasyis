import { supabase } from "@/integrations/supabase/client";

export interface DiaryEntry {
  id: string;
  date: string;
  question: string;
  answer: string;
  story: string;
  audioUrl?: string;
}

// ── Supabase operations ──

export async function saveEntryToDb(entry: {
  question: string;
  original_text: string;
  ai_story: string;
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
    })
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

  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.created_at,
    question: row.question,
    answer: row.original_text,
    story: row.ai_story,
  }));
}

export async function deleteEntryFromDb(id: string): Promise<void> {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}

// ── Legacy localStorage helpers (kept for offline fallback) ──

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

// ── Questions pool ──

const questionsRu = [
  "Какой момент из детства вы никогда не забудете?",
  "Что сегодня сделало вас счастливым?",
  "За что вы благодарны сегодня?",
  "Какой момент дня запомнился больше всего?",
  "Что нового вы узнали сегодня?",
  "Кто сегодня вас вдохновил?",
  "Какая мысль не покидала вас весь день?",
  "Что бы вы хотели сказать себе утром?",
  "Какой звук или запах вы запомнили сегодня?",
  "Что вы хотите запомнить об этом дне?",
  "Что заставило вас улыбнуться сегодня?",
  "О чём вы мечтали сегодня?",
  "Какой маленький поступок принёс вам радость?",
  "Какое место на Земле вы считаете своим?",
  "Что вы хотели бы рассказать своим внукам?",
  "Какой разговор изменил вашу жизнь?",
  "Что вас удивило в последнее время?",
  "Какую книгу или фильм вы хотели бы пережить заново?",
];

const questionsEn = [
  "What childhood moment will you never forget?",
  "What made you happy today?",
  "What are you grateful for today?",
  "What moment stood out the most today?",
  "What new thing did you learn today?",
  "Who inspired you today?",
  "What thought stayed with you all day?",
  "What would you tell your morning self?",
  "What sound or smell do you remember from today?",
  "What do you want to remember about this day?",
  "What made you smile today?",
  "What did you dream about today?",
  "What small act brought you joy?",
  "What place on Earth do you call your own?",
  "What would you want to tell your grandchildren?",
  "What conversation changed your life?",
  "What surprised you recently?",
  "What book or movie would you want to experience again?",
];

export function getTodayQuestion(lang: "ru" | "en"): string {
  const questions = lang === "ru" ? questionsRu : questionsEn;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return questions[dayOfYear % questions.length];
}

export function getRandomQuestion(lang: "ru" | "en", exclude?: string): string {
  const questions = lang === "ru" ? questionsRu : questionsEn;
  const filtered = exclude ? questions.filter((q) => q !== exclude) : questions;
  return filtered[Math.floor(Math.random() * filtered.length)];
}
