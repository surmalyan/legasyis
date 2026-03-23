import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { getTodayQuestion } from "@/lib/diary-store";
import { PenLine } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import BottomNav from "@/components/BottomNav";

const HomePage = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const question = getTodayQuestion(lang);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-14 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("appName")}
        </h1>
        <LanguageToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Date */}
          <p className="text-sm text-diary-text-secondary font-medium mb-2 text-center">
            {new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>

          {/* Label */}
          <p className="text-xs uppercase tracking-widest text-primary font-semibold text-center mb-6">
            {t("questionOfTheDay")}
          </p>

          {/* Question card */}
          <div className="bg-card rounded-2xl p-8 shadow-sm border border-border mb-10">
            <p className="text-2xl font-light leading-relaxed text-foreground text-center">
              {question}
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate("/entry", { state: { question } })}
            className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-medium transition-all active:scale-[0.97] hover:opacity-90"
          >
            <PenLine size={22} />
            {t("writeAnswer")}
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default HomePage;
