import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { chapterLabels, chapterOrder } from "@/lib/questions";
import { ChevronLeft, Download, Loader2, BookOpen, Sparkles, Palette, Check, Lock, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { bookThemes, generateBookStyles, type BookTheme } from "@/lib/book-themes";
import { bookTypes, bookTypeOrder, type BookType } from "@/lib/book-types";

const ExportPage = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<BookTheme>("classic");
  const [selectedType, setSelectedType] = useState<BookType>("standard");
  const [entryCount, setEntryCount] = useState(0);
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    supabase
      .from("entries")
      .select("chapter")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const entries = data || [];
        setEntryCount(entries.length);
        const counts: Record<string, number> = {};
        entries.forEach((e) => {
          const ch = e.chapter || "reflections";
          counts[ch] = (counts[ch] || 0) + 1;
        });
        setChapterCounts(counts);
      });
  }, [user]);

  const t = {
    title: lang === "ru" ? "Книга жизни" : "Life Book",
    generate: lang === "ru" ? "Создать книгу" : "Generate Book",
    noData: lang === "ru" ? "Нет записей для создания книги. Ответьте хотя бы на несколько вопросов." : "No entries to create a book. Answer at least a few questions first.",
    loading: lang === "ru" ? "Создаём вашу книгу..." : "Creating your book...",
    stepProfile: lang === "ru" ? "Загружаем данные профиля..." : "Loading profile data...",
    stepEntries: lang === "ru" ? "Собираем ваши записи..." : "Collecting your entries...",
    stepAI: lang === "ru" ? "ИИ пишет главы вашей книги..." : "AI is writing your book chapters...",
    stepRender: lang === "ru" ? "Форматируем книгу..." : "Formatting the book...",
    cover: lang === "ru" ? "Автобиография" : "Autobiography",
    toc: lang === "ru" ? "Оглавление" : "Table of Contents",
    profileSection: lang === "ru" ? "Об авторе" : "About the Author",
    chooseType: lang === "ru" ? "Тип книги" : "Book Type",
    chooseStyle: lang === "ru" ? "Стиль оформления" : "Book Style",
    yourEntries: lang === "ru" ? "Ваших записей" : "Your entries",
    needMore: lang === "ru" ? "Нужно ещё" : "Need",
    more: lang === "ru" ? "записей" : "more entries",
    available: lang === "ru" ? "Доступно" : "Available",
    chaptersReady: lang === "ru" ? "глав готово" : "chapters ready",
  };

  const profileLabels: Record<string, Record<string, string>> = {
    ru: {
      full_name: "Имя", birth_date: "Дата рождения", city: "Город",
      occupation: "Род деятельности", family: "Семья", hobbies: "Увлечения",
      life_motto: "Жизненное кредо", biggest_dream: "Главная мечта",
      grateful_for: "Благодарность", advice_to_descendants: "Совет потомкам",
      would_change: "Что бы изменили",
    },
    en: {
      full_name: "Name", birth_date: "Date of Birth", city: "City",
      occupation: "Occupation", family: "Family", hobbies: "Hobbies",
      life_motto: "Life Motto", biggest_dream: "Biggest Dream",
      grateful_for: "Grateful For", advice_to_descendants: "Advice to Descendants",
      would_change: "What Would You Change",
    },
  };

  const filledChapters = Object.keys(chapterCounts).length;
  const currentTypeConfig = bookTypes[selectedType];
  const isTypeAvailable = entryCount >= currentTypeConfig.minEntries;
  const entriesNeeded = Math.max(0, currentTypeConfig.minEntries - entryCount);

  const handleExport = async () => {
    if (!user || !isTypeAvailable) return;
    setGenerating(true);

    try {
      setProgress(t.stepProfile);
      const [profileRes, entriesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("entries").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      ]);

      const profile = profileRes.data;
      const entries = entriesRes.data || [];

      if (entries.length === 0) {
        toast.error(t.noData);
        setGenerating(false);
        setProgress("");
        return;
      }

      setProgress(t.stepEntries);

      // Group entries by chapter
      const chaptersMap: Record<string, Array<{ question: string; answer: string }>> = {};
      for (const entry of entries) {
        const ch = entry.chapter || "reflections";
        if (!chaptersMap[ch]) chaptersMap[ch] = [];
        chaptersMap[ch].push({ question: entry.question, answer: entry.ai_story });
      }

      // Limit chapters for mini book type
      let allowedChapters = chapterOrder;
      if (currentTypeConfig.maxChapters) {
        // Pick chapters with most entries
        const sorted = chapterOrder
          .filter((ch) => chaptersMap[ch])
          .sort((a, b) => (chaptersMap[b]?.length || 0) - (chaptersMap[a]?.length || 0));
        allowedChapters = sorted.slice(0, currentTypeConfig.maxChapters);
      }

      const filteredChapters: Record<string, Array<{ question: string; answer: string }>> = {};
      for (const ch of allowedChapters) {
        if (chaptersMap[ch]) filteredChapters[ch] = chaptersMap[ch];
      }

      setProgress(t.stepAI);

      let narratives: Record<string, string> = {};
      try {
        const { data, error } = await supabase.functions.invoke("generate-book", {
          body: { chapters: filteredChapters, profile, lang },
        });
        if (error) throw error;
        narratives = data.chapters || {};
      } catch (aiError) {
        console.warn("AI generation failed, using raw entries:", aiError);
        for (const [ch, ents] of Object.entries(filteredChapters)) {
          narratives[ch] = ents.map((e) => e.answer).join("\n\n");
        }
      }

      setProgress(t.stepRender);

      const orderedChapters = chapterOrder
        .filter((ch) => narratives[ch])
        .map((ch, idx) => ({
          key: ch,
          number: idx + 1,
          title: chapterLabels[lang as "ru" | "en"]?.[ch] || ch,
          text: narratives[ch],
        }));

      const labels = profileLabels[lang] || profileLabels.en;
      const profileFieldsHtml = profile
        ? Object.entries(labels)
            .filter(([key]) => profile[key as keyof typeof profile])
            .map(([key, label]) =>
              `<div class="profile-field"><span class="label">${label}</span><span class="value">${profile[key as keyof typeof profile]}</span></div>`
            )
            .join("")
        : "";

      const authorName = profile?.full_name || (lang === "ru" ? "Автор" : "Author");
      const year = new Date().getFullYear();

      const bookTypeName = lang === "ru" ? currentTypeConfig.nameRu : currentTypeConfig.nameEn;

      const tocHtml = orderedChapters
        .map((ch) =>
          `<div class="toc-item"><span class="toc-chapter">${lang === "ru" ? "Глава" : "Chapter"} ${ch.number}</span><span class="toc-title">${ch.title}</span></div>`
        )
        .join("");

      // Epigraphs for premium/legacy
      const epigraphs: Record<string, Record<string, string>> = {
        ru: {
          childhood: "Детство — это то, что мы потеряли во времени, но сохранили в сердце.",
          family: "Семья — это не главное. Это всё.",
          relationships: "Люди, которых мы любим, становятся частью нас.",
          career: "Работа — это любовь, ставшая видимой.",
          daily_life: "Счастье прячется в мелочах повседневности.",
          travel: "Мир — это книга, и те, кто не путешествует, читают лишь одну страницу.",
          dreams: "Мечта — это дорожная карта вашей души.",
          values: "Ценности — это компас, который не даёт заблудиться.",
          gratitude: "Благодарность превращает то, что мы имеем, в достаточное.",
          wisdom: "Мудрость приходит с возрастом, но иногда возраст приходит один.",
          memories: "Воспоминания — единственный рай, из которого нас не могут изгнать.",
          reflections: "Жизнь можно понять, лишь оглядываясь назад.",
        },
        en: {
          childhood: "Childhood is what we lost in time but kept in our hearts.",
          family: "Family is not an important thing. It's everything.",
          relationships: "The people we love become a part of us.",
          career: "Work is love made visible.",
          daily_life: "Happiness hides in the small things of everyday life.",
          travel: "The world is a book and those who don't travel read only one page.",
          dreams: "A dream is a roadmap for your soul.",
          values: "Values are the compass that keeps you from getting lost.",
          gratitude: "Gratitude turns what we have into enough.",
          wisdom: "Wisdom comes with age, but sometimes age comes alone.",
          memories: "Memories are the only paradise from which we cannot be driven.",
          reflections: "Life can only be understood looking backwards.",
        },
      };

      const showEpigraphs = selectedType === "premium" || selectedType === "legacy";

      const chaptersHtml = orderedChapters
        .map((ch) => {
          const epigraph = showEpigraphs && epigraphs[lang]?.[ch.key]
            ? `<p style="font-style:italic;text-align:center;color:${bookThemes[selectedTheme].mutedColor};margin-bottom:24px;font-size:13px;">"${epigraphs[lang][ch.key]}"</p>`
            : "";
          return `
          <div class="chapter-page">
            <div class="chapter-header">
              <span class="chapter-num">${lang === "ru" ? "Глава" : "Chapter"} ${ch.number}</span>
              <h2 class="chapter-title">${ch.title}</h2>
              <div class="chapter-divider"></div>
            </div>
            ${epigraph}
            <div class="chapter-text">${ch.text.replace(/\n/g, "<br/>")}</div>
          </div>
        `;
        })
        .join("");

      // Letter to descendants for legacy type
      const letterHtml = selectedType === "legacy" && profile?.advice_to_descendants
        ? `<div class="chapter-page">
            <div class="chapter-header">
              <span class="chapter-num">${lang === "ru" ? "Послесловие" : "Afterword"}</span>
              <h2 class="chapter-title">${lang === "ru" ? "Письмо потомкам" : "Letter to Descendants"}</h2>
              <div class="chapter-divider"></div>
            </div>
            <div class="chapter-text">${profile.advice_to_descendants.replace(/\n/g, "<br/>")}</div>
          </div>`
        : "";

      const themeConfig = bookThemes[selectedTheme];
      const styles = generateBookStyles(themeConfig);

      const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>Legacy — ${authorName}</title>
  <style>${styles}</style>
</head>
<body>

  <!-- COVER -->
  <div class="cover">
    <div class="cover-content">
      <div class="cover-ornament"></div>
      <div class="cover-logo">Legacy</div>
      <h1 class="cover-title">${authorName}</h1>
      <p class="cover-subtitle">${t.cover}</p>
      ${selectedType !== "mini" ? `<p style="font-size:12px;opacity:0.6;margin-top:8px;letter-spacing:2px;">${bookTypeName}</p>` : ""}
      <div class="cover-ornament-bottom"></div>
      <p class="cover-year">${year}</p>
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  <div class="toc-page">
    <h2 class="toc-heading">${t.toc}</h2>
    ${tocHtml}
  </div>

  <!-- ABOUT AUTHOR -->
  ${profileFieldsHtml ? `
  <div class="author-page">
    <h2 class="author-heading">${t.profileSection}</h2>
    ${profileFieldsHtml}
  </div>
  ` : ""}

  <!-- CHAPTERS -->
  ${chaptersHtml}

  <!-- LETTER TO DESCENDANTS -->
  ${letterHtml}

  <!-- BACK COVER -->
  <div class="back-cover">
    <div class="back-logo">Legacy</div>
    <p class="back-tagline">${lang === "ru" ? "Сохраняя истории для будущих поколений" : "Preserving stories for future generations"}</p>
  </div>

</body>
</html>`;

      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 800);
      }

      toast.success(lang === "ru" ? "Книга готова!" : "Book is ready!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error(lang === "ru" ? "Ошибка создания книги" : "Book generation failed");
    } finally {
      setGenerating(false);
      setProgress("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center gap-3 px-6 pt-14 pb-6">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-foreground font-serif-display">{t.title}</h1>
      </header>

      <main className="flex-1 px-6 pb-28 max-w-md mx-auto w-full">
        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{entryCount}</p>
            <p className="text-xs text-muted-foreground">{t.yourEntries}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{filledChapters}</p>
            <p className="text-xs text-muted-foreground">{t.chaptersReady}</p>
          </div>
        </div>

        {/* Book type selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">{t.chooseType}</span>
          </div>
          <div className="space-y-2">
            {bookTypeOrder.map((typeId) => {
              const bt = bookTypes[typeId];
              const available = entryCount >= bt.minEntries;
              const isSelected = selectedType === typeId;
              const needed = Math.max(0, bt.minEntries - entryCount);

              return (
                <button
                  key={typeId}
                  onClick={() => setSelectedType(typeId)}
                  className={`w-full relative flex items-start gap-3 rounded-2xl border-2 px-4 py-3.5 transition-all text-left ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : available
                        ? "border-border bg-card hover:border-primary/30"
                        : "border-border/50 bg-muted/30 opacity-60"
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check size={12} className="text-primary-foreground" />
                      </div>
                    ) : !available ? (
                      <Lock size={16} className="text-muted-foreground mt-0.5" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{bt.emoji}</span>
                      <span className="font-semibold text-foreground text-sm">
                        {lang === "ru" ? bt.nameRu : bt.nameEn}
                      </span>
                      {bt.recommended && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          {lang === "ru" ? "Рекомендуем" : "Recommended"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lang === "ru" ? bt.descRu : bt.descEn}
                    </p>
                    {!available && (
                      <p className="text-xs text-primary mt-1 font-medium">
                        {t.needMore} {needed} {t.more}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {bt.features.map((f, i) => (
                        <span key={i} className="text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full">
                          {lang === "ru" ? f.ru : f.en}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">{t.chooseStyle}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(bookThemes) as BookTheme[]).map((themeId) => {
              const th = bookThemes[themeId];
              const isSelected = selectedTheme === themeId;
              return (
                <button
                  key={themeId}
                  onClick={() => setSelectedTheme(themeId)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <span className="text-2xl">{th.emoji}</span>
                  <span className="text-xs font-semibold text-foreground">
                    {lang === "ru" ? th.nameRu : th.nameEn}
                  </span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">
                    {lang === "ru" ? th.descRu : th.descEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleExport}
          disabled={generating || !isTypeAvailable}
          className="w-full flex flex-col items-center justify-center gap-1 bg-primary text-primary-foreground rounded-2xl py-4 text-base font-medium transition-all active:scale-[0.97] disabled:opacity-40"
        >
          {generating ? (
            <>
              <Loader2 size={22} className="animate-spin" />
              <span className="text-xs opacity-80">{progress}</span>
            </>
          ) : (
            <span className="flex items-center gap-2">
              <Download size={20} />
              {t.generate}
            </span>
          )}
        </button>

        {!isTypeAvailable && (
          <p className="text-xs text-center text-muted-foreground mt-3">
            {lang === "ru"
              ? `Ответьте ещё на ${entriesNeeded} вопросов, чтобы открыть этот тип книги`
              : `Answer ${entriesNeeded} more questions to unlock this book type`}
          </p>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ExportPage;
