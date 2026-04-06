// Book types based on content volume and format
export type BookType = "mini" | "standard" | "premium" | "legacy";

export interface BookTypeConfig {
  id: BookType;
  nameRu: string;
  nameEn: string;
  descRu: string;
  descEn: string;
  emoji: string;
  minEntries: number;
  maxChapters: number | null; // null = unlimited
  features: { ru: string; en: string }[];
  recommended?: boolean;
}

export const bookTypes: Record<BookType, BookTypeConfig> = {
  mini: {
    id: "mini",
    nameRu: "Мини-книга",
    nameEn: "Mini Book",
    descRu: "Краткая история — идеально для начала",
    descEn: "Brief story — perfect to start",
    emoji: "📖",
    minEntries: 5,
    maxChapters: 3,
    features: [
      { ru: "До 3 глав", en: "Up to 3 chapters" },
      { ru: "Краткий формат", en: "Short format" },
      { ru: "PDF-экспорт", en: "PDF export" },
    ],
  },
  standard: {
    id: "standard",
    nameRu: "Стандартная книга",
    nameEn: "Standard Book",
    descRu: "Полноценная автобиография",
    descEn: "Full autobiography",
    emoji: "📕",
    minEntries: 20,
    maxChapters: 12,
    recommended: true,
    features: [
      { ru: "Все 12 глав", en: "All 12 chapters" },
      { ru: "ИИ-нарратив", en: "AI narrative" },
      { ru: "Профиль автора", en: "Author profile" },
      { ru: "3 стиля оформления", en: "3 design themes" },
    ],
  },
  premium: {
    id: "premium",
    nameRu: "Премиум издание",
    nameEn: "Premium Edition",
    descRu: "Расширенная версия с фото и цитатами",
    descEn: "Extended version with photos & quotes",
    emoji: "📗",
    minEntries: 50,
    maxChapters: null,
    features: [
      { ru: "Все 12 глав + бонусные", en: "All 12 chapters + bonus" },
      { ru: "Эпиграфы к главам", en: "Chapter epigraphs" },
      { ru: "Расширенный профиль", en: "Extended profile" },
      { ru: "Премиум оформление", en: "Premium design" },
    ],
  },
  legacy: {
    id: "legacy",
    nameRu: "Наследие",
    nameEn: "Legacy Edition",
    descRu: "Полная история жизни — подарок потомкам",
    descEn: "Complete life story — a gift to descendants",
    emoji: "📚",
    minEntries: 100,
    maxChapters: null,
    features: [
      { ru: "Полная автобиография", en: "Complete autobiography" },
      { ru: "Семейное древо", en: "Family tree included" },
      { ru: "Письмо потомкам", en: "Letter to descendants" },
      { ru: "Хронология жизни", en: "Life timeline" },
      { ru: "Премиум оформление", en: "Premium design" },
    ],
  },
};

export const bookTypeOrder: BookType[] = ["mini", "standard", "premium", "legacy"];
