export interface DiaryEntry {
  id: string;
  date: string;
  question: string;
  answer: string;
  story: string;
  audioUrl?: string;
}

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

// Questions pool
const questionsRu = [
  "Что сегодня сделало вас счастливым?",
  "За что вы благодарны сегодня?",
  "Какой момент дня запомнился больше всего?",
  "Что нового вы узнали сегодня?",
  "Если бы вы могли изменить одну вещь сегодня, что бы это было?",
  "Кто сегодня вас вдохновил?",
  "Какая мысль не покидала вас весь день?",
  "Что бы вы хотели сказать себе утром?",
  "Какой звук или запах вы запомнили сегодня?",
  "Что вы хотите запомнить об этом дне?",
  "Какой совет вы бы дали себе вчерашнему?",
  "Что заставило вас улыбнуться сегодня?",
  "О чём вы мечтали сегодня?",
  "Какой маленький поступок принёс вам радость?",
];

const questionsEn = [
  "What made you happy today?",
  "What are you grateful for today?",
  "What moment stood out the most today?",
  "What new thing did you learn today?",
  "If you could change one thing about today, what would it be?",
  "Who inspired you today?",
  "What thought stayed with you all day?",
  "What would you tell your morning self?",
  "What sound or smell do you remember from today?",
  "What do you want to remember about this day?",
  "What advice would you give yesterday's you?",
  "What made you smile today?",
  "What did you dream about today?",
  "What small act brought you joy?",
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

export function generateStory(question: string, answer: string, lang: "ru" | "en"): string {
  // Simple local story generation — can be replaced with AI later
  if (lang === "ru") {
    return `${new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.\n\nСегодня я задал(а) себе вопрос: «${question}»\n\n${answer}\n\nЭтот момент стоит помнить. Каждый день — это страница моей истории.`;
  }
  return `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.\n\nToday I asked myself: "${question}"\n\n${answer}\n\nThis moment is worth remembering. Every day is a page of my story.`;
}
