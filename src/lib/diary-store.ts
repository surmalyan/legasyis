import { supabase } from "@/integrations/supabase/client";

export interface DiaryEntry {
  id: string;
  date: string;
  question: string;
  answer: string;
  story: string;
  chapter?: string;
  audioUrl?: string;
}

// Chapter labels for display
export const chapterLabels: Record<string, Record<string, string>> = {
  ru: {
    childhood: "Детство",
    family: "Семья",
    career: "Карьера",
    values: "Ценности",
    dreams: "Мечты",
    travel: "Путешествия",
    gratitude: "Благодарность",
    wisdom: "Мудрость",
    daily_life: "Повседневность",
    relationships: "Отношения",
    memories: "Воспоминания",
    reflections: "Размышления",
  },
  en: {
    childhood: "Childhood",
    family: "Family",
    career: "Career",
    values: "Values",
    dreams: "Dreams",
    travel: "Travel",
    gratitude: "Gratitude",
    wisdom: "Wisdom",
    daily_life: "Daily Life",
    relationships: "Relationships",
    memories: "Memories",
    reflections: "Reflections",
  },
};

// Chapter order for book generation
export const chapterOrder = [
  "childhood",
  "family",
  "relationships",
  "career",
  "daily_life",
  "travel",
  "dreams",
  "values",
  "gratitude",
  "wisdom",
  "memories",
  "reflections",
];

// ── Questions mapped to chapters ──

interface MappedQuestion {
  ru: string;
  en: string;
  chapter: string;
}

const questionPool: MappedQuestion[] = [
  // Childhood
  { chapter: "childhood", ru: "Какой момент из детства вы никогда не забудете?", en: "What childhood moment will you never forget?" },
  { chapter: "childhood", ru: "Какая игра или занятие было вашим любимым в детстве?", en: "What was your favorite game or activity as a child?" },
  { chapter: "childhood", ru: "Кто из взрослых оказал на вас наибольшее влияние в детстве?", en: "Which adult had the biggest influence on you as a child?" },
  { chapter: "childhood", ru: "Какой запах или вкус напоминает вам о детстве?", en: "What smell or taste reminds you of childhood?" },

  // Family
  { chapter: "family", ru: "Расскажите о традиции вашей семьи.", en: "Tell about a family tradition." },
  { chapter: "family", ru: "Какой урок вы получили от родителей?", en: "What lesson did you learn from your parents?" },
  { chapter: "family", ru: "Какой семейный праздник запомнился больше всего?", en: "What family celebration was most memorable?" },
  { chapter: "family", ru: "Что вы хотели бы передать своим детям?", en: "What would you want to pass on to your children?" },

  // Relationships
  { chapter: "relationships", ru: "Какой разговор изменил вашу жизнь?", en: "What conversation changed your life?" },
  { chapter: "relationships", ru: "Кто ваш самый близкий друг и почему?", en: "Who is your closest friend and why?" },
  { chapter: "relationships", ru: "Какой совет по отношениям вы бы дали молодым?", en: "What relationship advice would you give to young people?" },
  { chapter: "relationships", ru: "Расскажите о встрече, которая изменила вашу судьбу.", en: "Tell about a meeting that changed your destiny." },

  // Career
  { chapter: "career", ru: "Чем вы занимаетесь и почему выбрали эту профессию?", en: "What do you do and why did you choose this profession?" },
  { chapter: "career", ru: "Какое достижение в работе вы считаете главным?", en: "What work achievement do you consider most important?" },
  { chapter: "career", ru: "Какой урок вы получили на работе?", en: "What lesson did you learn at work?" },
  { chapter: "career", ru: "Если бы вы начали карьеру заново, что бы изменили?", en: "If you could restart your career, what would you change?" },

  // Daily Life
  { chapter: "daily_life", ru: "Что сегодня сделало вас счастливым?", en: "What made you happy today?" },
  { chapter: "daily_life", ru: "Какой момент дня запомнился больше всего?", en: "What moment stood out the most today?" },
  { chapter: "daily_life", ru: "Что заставило вас улыбнуться сегодня?", en: "What made you smile today?" },
  { chapter: "daily_life", ru: "Какой маленький поступок принёс вам радость?", en: "What small act brought you joy?" },

  // Travel
  { chapter: "travel", ru: "Какое место на Земле вы считаете своим?", en: "What place on Earth do you call your own?" },
  { chapter: "travel", ru: "Куда бы вы хотели вернуться снова?", en: "Where would you want to return to again?" },
  { chapter: "travel", ru: "Какое путешествие изменило ваш взгляд на мир?", en: "What journey changed your view of the world?" },
  { chapter: "travel", ru: "Опишите место, где вы чувствуете себя в безопасности.", en: "Describe a place where you feel safe." },

  // Dreams
  { chapter: "dreams", ru: "О чём вы мечтали сегодня?", en: "What did you dream about today?" },
  { chapter: "dreams", ru: "Какая мечта у вас ещё не осуществилась?", en: "What dream hasn't come true yet?" },
  { chapter: "dreams", ru: "Что бы вы сделали, если бы не было ограничений?", en: "What would you do if there were no limitations?" },
  { chapter: "dreams", ru: "Какой вы представляете свою жизнь через 10 лет?", en: "How do you imagine your life in 10 years?" },

  // Values
  { chapter: "values", ru: "Что для вас важнее всего в жизни?", en: "What is most important to you in life?" },
  { chapter: "values", ru: "Какой принцип вы никогда не нарушите?", en: "What principle would you never break?" },
  { chapter: "values", ru: "Что бы вы хотели рассказать своим внукам?", en: "What would you want to tell your grandchildren?" },
  { chapter: "values", ru: "Какая ценность досталась вам от предков?", en: "What value was passed down from your ancestors?" },

  // Gratitude
  { chapter: "gratitude", ru: "За что вы благодарны сегодня?", en: "What are you grateful for today?" },
  { chapter: "gratitude", ru: "Кому бы вы хотели сказать спасибо?", en: "Who would you like to thank?" },
  { chapter: "gratitude", ru: "Какой подарок судьбы вы цените больше всего?", en: "What gift of fate do you appreciate most?" },
  { chapter: "gratitude", ru: "Что хорошее произошло с вами на этой неделе?", en: "What good thing happened to you this week?" },

  // Wisdom
  { chapter: "wisdom", ru: "Что нового вы узнали сегодня?", en: "What new thing did you learn today?" },
  { chapter: "wisdom", ru: "Какой жизненный урок дался вам труднее всего?", en: "What life lesson was hardest for you?" },
  { chapter: "wisdom", ru: "Что бы вы посоветовали себе 20-летнему?", en: "What advice would you give your 20-year-old self?" },
  { chapter: "wisdom", ru: "Какая ошибка научила вас больше всего?", en: "What mistake taught you the most?" },

  // Memories
  { chapter: "memories", ru: "Какой звук или запах вы запомнили сегодня?", en: "What sound or smell do you remember from today?" },
  { chapter: "memories", ru: "Что вы хотите запомнить об этом дне?", en: "What do you want to remember about this day?" },
  { chapter: "memories", ru: "Какую книгу или фильм вы хотели бы пережить заново?", en: "What book or movie would you want to experience again?" },
  { chapter: "memories", ru: "Какое воспоминание греет вас в трудные дни?", en: "What memory warms you on hard days?" },

  // Reflections
  { chapter: "reflections", ru: "Какая мысль не покидала вас весь день?", en: "What thought stayed with you all day?" },
  { chapter: "reflections", ru: "Что бы вы хотели сказать себе утром?", en: "What would you tell your morning self?" },
  { chapter: "reflections", ru: "Что вас удивило в последнее время?", en: "What surprised you recently?" },
  { chapter: "reflections", ru: "Кто сегодня вас вдохновил?", en: "Who inspired you today?" },
];

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

// ── Question selection ──

export function getTodayQuestion(lang: "ru" | "en"): { text: string; chapter: string } {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const q = questionPool[dayOfYear % questionPool.length];
  return { text: q[lang], chapter: q.chapter };
}

export function getRandomQuestion(lang: "ru" | "en", excludeText?: string): { text: string; chapter: string } {
  const filtered = excludeText
    ? questionPool.filter((q) => q[lang] !== excludeText)
    : questionPool;
  const q = filtered[Math.floor(Math.random() * filtered.length)];
  return { text: q[lang], chapter: q.chapter };
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
