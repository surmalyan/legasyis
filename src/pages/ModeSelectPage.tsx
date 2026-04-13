import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import BackgroundPattern from "@/components/BackgroundPattern";
import StaticLogo from "@/components/StaticLogo";
import { BookOpen, Heart } from "lucide-react";

const ModeSelectPage = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <BackgroundPattern />
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <StaticLogo size={80} className="mb-6 animate-fade-in" />

        <h1 className="text-2xl font-serif-display font-light text-foreground text-center mb-2 animate-fade-in">
          {lang === "ru" ? "Добро пожаловать в Legacy" : "Welcome to Legacy"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-10 max-w-xs animate-fade-in">
          {lang === "ru"
            ? "Что бы вы хотели сохранить?"
            : "What would you like to preserve?"}
        </p>

        <div className="w-full max-w-sm space-y-4">
          {/* Own life story */}
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-start gap-4 bg-card border border-border rounded-2xl p-5 text-left transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98] animate-fade-in"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BookOpen size={22} className="text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground mb-1">
                {lang === "ru" ? "Создать свою историю жизни" : "Create your own life story"}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === "ru"
                  ? "Отвечайте на вопросы, записывайте воспоминания и создайте книгу о своей жизни"
                  : "Answer questions, record memories and create a book about your life"}
              </p>
            </div>
          </button>

          {/* Memorial */}
          <button
            onClick={() => navigate("/memorial/onboarding")}
            className="w-full flex items-start gap-4 bg-card border border-border rounded-2xl p-5 text-left transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.98] animate-fade-in"
          >
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
              <Heart size={22} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground mb-1">
                {lang === "ru"
                  ? "Сохранить память о близком человеке"
                  : "Create a memory of someone who passed away"}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === "ru"
                  ? "Соберите и сохраните воспоминания о дорогом человеке вместе с близкими"
                  : "Collect and preserve memories of a loved one together with family"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeSelectPage;
