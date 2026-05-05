export type LifePeriod =
  | "early_childhood"
  | "childhood"
  | "teenage"
  | "youth"
  | "early_adulthood"
  | "adulthood"
  | "middle_age"
  | "mature_years"
  | "later_years"
  | "final_years"
  | "unknown";

export type LifePeriodInfo = {
  key: LifePeriod;
  emoji: string;
  label: { ru: string; en: string };
  /** approximate age range (years from birth) */
  ageRange: [number, number];
  description: { ru: string; en: string };
};

export const LIFE_PERIODS: LifePeriodInfo[] = [
  {
    key: "early_childhood",
    emoji: "🍼",
    ageRange: [0, 5],
    label: { ru: "Раннее детство", en: "Early childhood" },
    description: { ru: "0–5 лет", en: "Ages 0–5" },
  },
  {
    key: "childhood",
    emoji: "🧒",
    ageRange: [6, 12],
    label: { ru: "Детство", en: "Childhood" },
    description: { ru: "6–12 лет", en: "Ages 6–12" },
  },
  {
    key: "teenage",
    emoji: "🎒",
    ageRange: [13, 17],
    label: { ru: "Подростковые годы", en: "Teenage years" },
    description: { ru: "13–17 лет", en: "Ages 13–17" },
  },
  {
    key: "youth",
    emoji: "🌱",
    ageRange: [18, 25],
    label: { ru: "Юность", en: "Youth" },
    description: { ru: "18–25 лет", en: "Ages 18–25" },
  },
  {
    key: "early_adulthood",
    emoji: "💼",
    ageRange: [26, 35],
    label: { ru: "Молодые годы", en: "Early adulthood" },
    description: { ru: "26–35 лет", en: "Ages 26–35" },
  },
  {
    key: "adulthood",
    emoji: "🏡",
    ageRange: [36, 50],
    label: { ru: "Зрелые годы", en: "Adulthood" },
    description: { ru: "36–50 лет", en: "Ages 36–50" },
  },
  {
    key: "middle_age",
    emoji: "🌳",
    ageRange: [51, 60],
    label: { ru: "Средний возраст", en: "Middle age" },
    description: { ru: "51–60 лет", en: "Ages 51–60" },
  },
  {
    key: "mature_years",
    emoji: "📚",
    ageRange: [61, 70],
    label: { ru: "Мудрые годы", en: "Mature years" },
    description: { ru: "61–70 лет", en: "Ages 61–70" },
  },
  {
    key: "later_years",
    emoji: "🌅",
    ageRange: [71, 80],
    label: { ru: "Поздние годы", en: "Later years" },
    description: { ru: "71–80 лет", en: "Ages 71–80" },
  },
  {
    key: "final_years",
    emoji: "🕊️",
    ageRange: [81, 200],
    label: { ru: "Последние годы", en: "Final years" },
    description: { ru: "81+ лет", en: "Ages 81+" },
  },
  {
    key: "unknown",
    emoji: "✨",
    ageRange: [-1, -1],
    label: { ru: "Без периода", en: "Unspecified" },
    description: { ru: "Период не указан", en: "No period set" },
  },
];

export const getPeriodByYear = (year: number, birthYear?: number | null): LifePeriod => {
  if (!birthYear || !year) return "unknown";
  const age = year - birthYear;
  const found = LIFE_PERIODS.find((p) => age >= p.ageRange[0] && age <= p.ageRange[1]);
  return found?.key || "unknown";
};

export const getPeriodInfo = (key: string | null | undefined): LifePeriodInfo => {
  return LIFE_PERIODS.find((p) => p.key === key) || LIFE_PERIODS[LIFE_PERIODS.length - 1];
};

/** Year range in absolute calendar years for a given birth year */
export const getYearRange = (period: LifePeriodInfo, birthYear?: number | null): string | null => {
  if (!birthYear || period.key === "unknown") return null;
  const [a, b] = period.ageRange;
  const endYear = b > 100 ? new Date().getFullYear() : birthYear + b;
  return `${birthYear + a} – ${endYear}`;
};
