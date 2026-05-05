// Maps a life_period (used by Memory Circles) to a chapter key
// (used by the user's autobiography). Used to group circle memories
// at the end of the relevant chapter in the Book PDF export.
export const periodToChapter: Record<string, string> = {
  early_childhood: "childhood",
  childhood: "childhood",
  teenage: "childhood",
  youth: "dreams",
  early_adulthood: "career",
  adulthood: "family",
  middle_age: "wisdom",
  mature_years: "wisdom",
  later_years: "reflections",
  final_years: "reflections",
  unknown: "memories",
};

export const mapPeriodToChapter = (period: string | null | undefined): string => {
  if (!period) return "memories";
  return periodToChapter[period] || "memories";
};