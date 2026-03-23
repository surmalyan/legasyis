import { useI18n } from "@/lib/i18n";

const LanguageToggle = () => {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === "ru" ? "en" : "ru")}
      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground transition-colors hover:bg-accent"
    >
      {lang === "ru" ? "EN" : "RU"}
    </button>
  );
};

export default LanguageToggle;
