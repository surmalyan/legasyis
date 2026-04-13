import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import BackgroundPattern from "@/components/BackgroundPattern";
import StaticLogo from "@/components/StaticLogo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Heart, UserPlus, ArrowRight } from "lucide-react";

type Step = "intro" | "details" | "invite";

const MemorialOnboardingPage = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [deathYear, setDeathYear] = useState("");
  const [relationship, setRelationship] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const relationships = lang === "ru"
    ? ["Мама", "Папа", "Бабушка", "Дедушка", "Супруг(а)", "Брат/Сестра", "Друг", "Другое"]
    : ["Mother", "Father", "Grandmother", "Grandfather", "Spouse", "Sibling", "Friend", "Other"];

  const handleContinueToHome = () => {
    // Store memorial context and navigate to main app
    localStorage.setItem("legacy_memorial", JSON.stringify({
      name,
      birthYear: birthYear || null,
      deathYear: deathYear || null,
      relationship,
    }));
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <BackgroundPattern />

      <header className="flex items-center px-6 pt-14 pb-4 relative z-10">
        <button
          onClick={() => {
            if (step === "intro") navigate("/mode-select");
            else if (step === "details") setStep("intro");
            else setStep("details");
          }}
          className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={24} />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pb-12 relative z-10">
        <div className="w-full max-w-sm">
          {/* Step: Intro */}
          {step === "intro" && (
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-6">
                <Heart size={28} className="text-muted-foreground" />
              </div>

              <h1 className="text-xl font-serif-display font-light text-foreground mb-4 leading-snug">
                {lang === "ru"
                  ? "Это пространство поможет вам\nсобрать и сохранить воспоминания\nо важном человеке"
                  : "This space helps you\ncollect and preserve memories\nof someone important"}
              </h1>

              <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-xs">
                {lang === "ru"
                  ? "Вы сможете записывать истории, приглашать близких добавлять свои воспоминания и создать книгу памяти"
                  : "You can record stories, invite loved ones to add their memories, and create a memorial book"}
              </p>

              <Button
                onClick={() => setStep("details")}
                className="w-full rounded-2xl py-5 text-base"
              >
                {lang === "ru" ? "Продолжить" : "Continue"}
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          )}

          {/* Step: Person details */}
          {step === "details" && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-serif-display font-light text-foreground text-center mb-1">
                {lang === "ru" ? "О ком вы хотите сохранить память?" : "Who would you like to remember?"}
              </h2>
              <p className="text-xs text-muted-foreground text-center mb-8">
                {lang === "ru" ? "Расскажите немного об этом человеке" : "Tell us a bit about this person"}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {lang === "ru" ? "Имя" : "Name"} *
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === "ru" ? "Как звали этого человека" : "What was their name"}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {lang === "ru" ? "Год рождения" : "Birth year"}
                    </label>
                    <Input
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      placeholder="1940"
                      type="number"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {lang === "ru" ? "Год ухода" : "Year of passing"}
                    </label>
                    <Input
                      value={deathYear}
                      onChange={(e) => setDeathYear(e.target.value)}
                      placeholder="2023"
                      type="number"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {lang === "ru" ? "Кем приходился вам" : "Relationship to you"} *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {relationships.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRelationship(r)}
                        className={`px-3 py-1.5 rounded-xl text-sm transition-all ${
                          relationship === r
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep("invite")}
                disabled={!name || !relationship}
                className="w-full rounded-2xl py-5 text-base mt-8"
              >
                {lang === "ru" ? "Далее" : "Next"}
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          )}

          {/* Step: Invite others */}
          {step === "invite" && (
            <div className="animate-fade-in">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-4">
                  <UserPlus size={24} className="text-muted-foreground" />
                </div>
                <h2 className="text-lg font-serif-display font-light text-foreground mb-2">
                  {lang === "ru"
                    ? "Пригласите близких"
                    : "Invite loved ones"}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  {lang === "ru"
                    ? `Пусть другие тоже поделятся воспоминаниями о ${name}. Вы сможете пригласить ещё людей позже.`
                    : `Let others share their memories of ${name} too. You can invite more people later.`}
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={lang === "ru" ? "Email близкого человека" : "Email of a loved one"}
                  type="email"
                  className="rounded-xl"
                />
                <Button
                  variant="secondary"
                  className="w-full rounded-2xl py-4"
                  disabled={!inviteEmail}
                  onClick={() => {
                    // TODO: send invite via backend
                    setInviteEmail("");
                  }}
                >
                  <UserPlus size={16} className="mr-2" />
                  {lang === "ru" ? "Отправить приглашение" : "Send invite"}
                </Button>
              </div>

              <div className="mt-8 space-y-3">
                <Button
                  onClick={handleContinueToHome}
                  className="w-full rounded-2xl py-5 text-base"
                >
                  {lang === "ru" ? "Начать" : "Get started"}
                </Button>
                <button
                  onClick={handleContinueToHome}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {lang === "ru" ? "Пропустить" : "Skip for now"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MemorialOnboardingPage;
