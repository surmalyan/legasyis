export type SparkMood = "funny" | "unusual" | "kind" | "vivid";

export const SPARK_MOODS: Record<SparkMood, { emoji: string; label: { ru: string; en: string } }> = {
  funny: { emoji: "😄", label: { ru: "Смешная", en: "Funny" } },
  unusual: { emoji: "🌀", label: { ru: "Необычная", en: "Unusual" } },
  kind: { emoji: "💛", label: { ru: "Добрая", en: "Heartwarming" } },
  vivid: { emoji: "✨", label: { ru: "Яркая", en: "Vivid" } },
};

export const STORY_SPARKS: Record<SparkMood, { ru: string; en: string }[]> = {
  funny: [
    { ru: "Какой случай, связанный с ним/ней, до сих пор вызывает у вас улыбку?", en: "What story about them still makes you smile?" },
    { ru: "Какую самую нелепую ситуацию вы пережили вместе?", en: "What was the silliest situation you went through together?" },
    { ru: "Над какой своей шуткой он/она смеялся(ась) громче всех?", en: "Which of their own jokes did they laugh at the loudest?" },
    { ru: "Какой розыгрыш или случай вы вспоминаете в семье до сих пор?", en: "What prank or moment does your family still bring up?" },
    { ru: "Что он/она сделал(а) такого, что вы не могли поверить своим глазам?", en: "What did they do that you couldn't believe?" },
  ],
  unusual: [
    { ru: "Какой странный или удивительный поступок он/она совершил(а)?", en: "What strange or surprising thing did they do?" },
    { ru: "Какая необычная привычка была только у него/неё?", en: "What unusual habit did only they have?" },
    { ru: "Какая история про него/неё звучит почти как выдумка?", en: "Which story about them sounds almost made up?" },
    { ru: "Какое его/её решение удивило всех вокруг?", en: "What decision of theirs surprised everyone?" },
    { ru: "Какое необычное место или встречу он/она вам запомнил(а)?", en: "What unusual place or encounter did they leave you with?" },
  ],
  kind: [
    { ru: "Какой добрый поступок с его/её стороны вы никогда не забудете?", en: "What kind act of theirs will you never forget?" },
    { ru: "Когда он/она помог(ла) вам в самый нужный момент?", en: "When did they help you exactly when you needed it?" },
    { ru: "Какие его/её слова поддержки вы храните в памяти?", en: "What words of support from them do you still hold close?" },
    { ru: "Что он/она делал(а) для других тихо, без огласки?", en: "What did they quietly do for others, without fanfare?" },
    { ru: "Какой подарок или жест от него/неё тронул вас больше всего?", en: "Which gift or gesture from them touched you most?" },
  ],
  vivid: [
    { ru: "Какой день рядом с ним/ней вы помните в мельчайших деталях?", en: "Which day with them do you remember in vivid detail?" },
    { ru: "Какой совместный момент стоит у вас перед глазами как фотография?", en: "What shared moment stays with you like a photograph?" },
    { ru: "Какая поездка или встреча оставила самый яркий след?", en: "Which trip or meeting left the brightest mark?" },
    { ru: "Какое его/её выражение лица вы никогда не забудете?", en: "What expression on their face will you never forget?" },
    { ru: "Какая мелочь — звук, запах, фраза — мгновенно возвращает вас к нему/ней?", en: "What small thing — a sound, smell, phrase — instantly takes you back to them?" },
  ],
};

export const pickRandomSpark = (mood: SparkMood, lang: string): string => {
  const list = STORY_SPARKS[mood];
  const item = list[Math.floor(Math.random() * list.length)];
  return item[lang as "ru" | "en"] || item.en;
};