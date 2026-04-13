export type MemorialCategory = "personality" | "habits" | "memories" | "emotions" | "values";

export const MEMORIAL_CATEGORIES: Record<string, Record<MemorialCategory, { label: string; emoji: string }>> = {
  ru: {
    personality: { label: "Личность", emoji: "✨" },
    habits: { label: "Привычки", emoji: "🔁" },
    memories: { label: "Воспоминания", emoji: "💭" },
    emotions: { label: "Эмоции", emoji: "💛" },
    values: { label: "Ценности", emoji: "🌿" },
  },
  en: {
    personality: { label: "Personality", emoji: "✨" },
    habits: { label: "Habits", emoji: "🔁" },
    memories: { label: "Memories", emoji: "💭" },
    emotions: { label: "Emotions", emoji: "💛" },
    values: { label: "Values", emoji: "🌿" },
  },
};

export type MemorialQuestion = {
  id: string;
  category: MemorialCategory;
  text: { ru: string; en: string };
};

export const MEMORIAL_QUESTIONS: MemorialQuestion[] = [
  // Personality
  { id: "p1", category: "personality", text: { ru: "Что было уникального в этом человеке?", en: "What was unique about them?" } },
  { id: "p2", category: "personality", text: { ru: "Как бы вы описали его/её характер тремя словами?", en: "How would you describe their character in three words?" } },
  { id: "p3", category: "personality", text: { ru: "Какое первое впечатление он/она производил(а) на людей?", en: "What first impression did they make on people?" } },
  { id: "p4", category: "personality", text: { ru: "В чём он/она был(а) по-настоящему талантлив(а)?", en: "What were they truly talented at?" } },
  { id: "p5", category: "personality", text: { ru: "Какую черту характера вы бы хотели унаследовать?", en: "What character trait would you like to inherit?" } },

  // Habits
  { id: "h1", category: "habits", text: { ru: "Какую фразу он/она часто говорил(а)?", en: "What phrase did they often say?" } },
  { id: "h2", category: "habits", text: { ru: "Было ли у него/неё любимое блюдо, которое он(а) готовил(а)?", en: "Did they have a favorite dish they used to cook?" } },
  { id: "h3", category: "habits", text: { ru: "Какой был его/её утренний ритуал?", en: "What was their morning ritual?" } },
  { id: "h4", category: "habits", text: { ru: "Какую музыку он/она любил(а)?", en: "What music did they love?" } },
  { id: "h5", category: "habits", text: { ru: "Как он/она проводил(а) выходные?", en: "How did they spend their weekends?" } },

  // Memories
  { id: "m1", category: "memories", text: { ru: "Какое ваше самое яркое воспоминание вместе?", en: "What is your most vivid memory together?" } },
  { id: "m2", category: "memories", text: { ru: "Расскажите смешную историю с его/её участием", en: "Share a funny story involving them" } },
  { id: "m3", category: "memories", text: { ru: "Какой совместный момент вы хотели бы пережить снова?", en: "What shared moment would you like to relive?" } },
  { id: "m4", category: "memories", text: { ru: "Опишите обычный день, проведённый с ним/ней", en: "Describe an ordinary day spent with them" } },
  { id: "m5", category: "memories", text: { ru: "Какое путешествие или приключение вы пережили вместе?", en: "What trip or adventure did you share together?" } },

  // Emotions
  { id: "e1", category: "emotions", text: { ru: "Когда этот человек был по-настоящему счастлив?", en: "When was this person truly happy?" } },
  { id: "e2", category: "emotions", text: { ru: "Что заставляло его/её смеяться?", en: "What made them laugh?" } },
  { id: "e3", category: "emotions", text: { ru: "Как он/она реагировал(а) в трудных ситуациях?", en: "How did they react in difficult situations?" } },
  { id: "e4", category: "emotions", text: { ru: "Как он/она выражал(а) любовь?", en: "How did they express love?" } },
  { id: "e5", category: "emotions", text: { ru: "Что бы вы хотели сказать ему/ей сейчас?", en: "What would you say to them now?" } },

  // Values
  { id: "v1", category: "values", text: { ru: "Чему он/она вас научил(а)?", en: "What did they teach you?" } },
  { id: "v2", category: "values", text: { ru: "Во что он/она верил(а) больше всего?", en: "What did they believe in most?" } },
  { id: "v3", category: "values", text: { ru: "Какой жизненный принцип он/она соблюдал(а)?", en: "What life principle did they follow?" } },
  { id: "v4", category: "values", text: { ru: "Как он/она помогал(а) другим людям?", en: "How did they help others?" } },
  { id: "v5", category: "values", text: { ru: "Какое наследие он/она оставил(а)?", en: "What legacy did they leave behind?" } },
];
