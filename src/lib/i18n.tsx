import React, { createContext, useContext, useState, useCallback } from "react";

export type Lang = "ru" | "en";

const translations = {
  ru: {
    appName: "MYLEGACY",
    questionOfTheDay: "Вопрос дня",
    writeAnswer: "Написать ответ",
    recordAudio: "Записать голос",
    yourAnswer: "Ваш ответ...",
    save: "Сохранить",
    back: "Назад",
    archive: "Архив",
    home: "Главная",
    story: "История",
    noEntries: "Пока нет записей",
    startWriting: "Начните свою историю сегодня",
    generatedStory: "Ваша история",
    viewStory: "Читать историю",
    today: "Сегодня",
    date: "Дата",
    delete: "Удалить",
    recording: "Запись...",
    stopRecording: "Остановить",
    textMode: "Текст",
    voiceMode: "Голос",
    savedSuccessfully: "Запись сохранена",
    shareStory: "Поделиться",
  },
  en: {
    appName: "MYLEGACY",
    questionOfTheDay: "Question of the Day",
    writeAnswer: "Write Answer",
    recordAudio: "Record Voice",
    yourAnswer: "Your answer...",
    save: "Save",
    back: "Back",
    archive: "Archive",
    home: "Home",
    story: "Story",
    noEntries: "No entries yet",
    startWriting: "Start your legacy today",
    generatedStory: "Your Story",
    viewStory: "Read Story",
    today: "Today",
    date: "Date",
    delete: "Delete",
    recording: "Recording...",
    stopRecording: "Stop",
    textMode: "Text",
    voiceMode: "Voice",
    savedSuccessfully: "Entry saved",
    shareStory: "Share",
  },
} as const;

type TranslationKey = keyof typeof translations.ru;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("diary-lang");
    return (saved as Lang) || "ru";
  });

  const changeLang = useCallback((newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem("diary-lang", newLang);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[lang][key],
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
