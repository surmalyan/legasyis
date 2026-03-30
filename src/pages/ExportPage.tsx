import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { chapterLabels, chapterOrder } from "@/lib/questions";
import { ChevronLeft, Download, Loader2, BookOpen, Sparkles, Palette } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { bookThemes, generateBookStyles, type BookTheme } from "@/lib/book-themes";

const ExportPage = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<BookTheme>("classic");

  const t = {
    title: lang === "ru" ? "Книга жизни" : "Life Book",
    desc: lang === "ru"
      ? "ИИ объединит все ваши ответы в красивую автобиографию с главами"
      : "AI will combine all your answers into a beautiful autobiography with chapters",
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
  };

  const profileLabels: Record<string, Record<string, string>> = {
    ru: {
      full_name: "Имя",
      birth_date: "Дата рождения",
      city: "Город",
      occupation: "Род деятельности",
      family: "Семья",
      hobbies: "Увлечения",
      life_motto: "Жизненное кредо",
      biggest_dream: "Главная мечта",
      grateful_for: "Благодарность",
      advice_to_descendants: "Совет потомкам",
      would_change: "Что бы изменили",
    },
    en: {
      full_name: "Name",
      birth_date: "Date of Birth",
      city: "City",
      occupation: "Occupation",
      family: "Family",
      hobbies: "Hobbies",
      life_motto: "Life Motto",
      biggest_dream: "Biggest Dream",
      grateful_for: "Grateful For",
      advice_to_descendants: "Advice to Descendants",
      would_change: "What Would You Change",
    },
  };

  const handleExport = async () => {
    if (!user) return;
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

      setProgress(t.stepAI);

      // Call AI to generate cohesive narratives per chapter
      let narratives: Record<string, string> = {};
      try {
        const { data, error } = await supabase.functions.invoke("generate-book", {
          body: { chapters: chaptersMap, profile, lang },
        });
        if (error) throw error;
        narratives = data.chapters || {};
      } catch (aiError) {
        console.warn("AI generation failed, using raw entries:", aiError);
        // Fallback: use raw entries
        for (const [ch, entries] of Object.entries(chaptersMap)) {
          narratives[ch] = entries.map((e) => e.answer).join("\n\n");
        }
      }

      setProgress(t.stepRender);

      // Build ordered chapters for book
      const orderedChapters = chapterOrder
        .filter((ch) => narratives[ch])
        .map((ch, idx) => ({
          key: ch,
          number: idx + 1,
          title: chapterLabels[lang as "ru" | "en"]?.[ch] || ch,
          text: narratives[ch],
        }));

      // Profile fields
      const labels = profileLabels[lang] || profileLabels.en;
      const profileFieldsHtml = profile
        ? Object.entries(labels)
            .filter(([key]) => profile[key as keyof typeof profile])
            .map(
              ([key, label]) =>
                `<div class="profile-field"><span class="label">${label}</span><span class="value">${profile[key as keyof typeof profile]}</span></div>`
            )
            .join("")
        : "";

      const authorName = profile?.full_name || (lang === "ru" ? "Автор" : "Author");
      const year = new Date().getFullYear();

      // TOC html
      const tocHtml = orderedChapters
        .map(
          (ch) =>
            `<div class="toc-item"><span class="toc-chapter">Глава ${ch.number}</span><span class="toc-title">${ch.title}</span></div>`
        )
        .join("");

      // Chapters html
      const chaptersHtml = orderedChapters
        .map(
          (ch) => `
          <div class="chapter-page">
            <div class="chapter-header">
              <span class="chapter-num">${lang === "ru" ? "Глава" : "Chapter"} ${ch.number}</span>
              <h2 class="chapter-title">${ch.title}</h2>
              <div class="chapter-divider"></div>
            </div>
            <div class="chapter-text">${ch.text.replace(/\n/g, "<br/>")}</div>
          </div>
        `
        )
        .join("");

      const themeConfig = bookThemes[selectedTheme];
      const styles = generateBookStyles(themeConfig);

      const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>MYLEGACY — ${authorName}</title>
  <style>${styles}</style>
    
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Source Sans 3', 'Segoe UI', sans-serif;
      color: #2d2520;
      background: #fff;
      font-size: 13px;
      line-height: 1.8;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── COVER PAGE ── */
    .cover {
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(160deg, #f7f3ee 0%, #e8ddd0 40%, #c4a882 100%);
      text-align: center;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }
    .cover::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 60%),
                  radial-gradient(ellipse at 70% 80%, rgba(180,150,110,0.3) 0%, transparent 50%);
    }
    .cover-content { position: relative; z-index: 1; padding: 40px; }
    .cover-ornament {
      width: 80px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #8b7355, transparent);
      margin: 0 auto 32px;
    }
    .cover-logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 16px;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: #8b7355;
      margin-bottom: 48px;
    }
    .cover-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 52px;
      font-weight: 300;
      color: #2d2520;
      line-height: 1.2;
      margin-bottom: 12px;
    }
    .cover-subtitle {
      font-family: 'Cormorant Garamond', serif;
      font-size: 22px;
      font-weight: 400;
      font-style: italic;
      color: #6b5d4f;
      margin-bottom: 48px;
    }
    .cover-author {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      font-weight: 500;
      color: #3d3530;
      letter-spacing: 2px;
    }
    .cover-year {
      font-size: 14px;
      color: #8b7d6b;
      margin-top: 40px;
      letter-spacing: 3px;
    }
    .cover-ornament-bottom {
      width: 120px;
      height: 1px;
      background: linear-gradient(90deg, transparent, #8b7355, transparent);
      margin: 24px auto 0;
    }

    /* ── TOC PAGE ── */
    .toc-page {
      padding: 80px 60px;
      page-break-after: always;
      min-height: 100vh;
    }
    .toc-heading {
      font-family: 'Cormorant Garamond', serif;
      font-size: 32px;
      font-weight: 600;
      color: #2d2520;
      text-align: center;
      margin-bottom: 48px;
    }
    .toc-heading::after {
      content: '';
      display: block;
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #c4a882, transparent);
      margin: 16px auto 0;
    }
    .toc-item {
      display: flex;
      align-items: baseline;
      padding: 12px 0;
      border-bottom: 1px dotted #e5ddd0;
    }
    .toc-chapter {
      font-family: 'Cormorant Garamond', serif;
      font-size: 14px;
      color: #8b7d6b;
      width: 80px;
      flex-shrink: 0;
    }
    .toc-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 20px;
      font-weight: 500;
      color: #2d2520;
    }

    /* ── ABOUT AUTHOR PAGE ── */
    .author-page {
      padding: 80px 60px;
      page-break-after: always;
      min-height: 100vh;
    }
    .author-heading {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      font-weight: 600;
      color: #2d2520;
      text-align: center;
      margin-bottom: 40px;
    }
    .author-heading::after {
      content: '';
      display: block;
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #c4a882, transparent);
      margin: 16px auto 0;
    }
    .profile-field {
      display: flex;
      padding: 14px 0;
      border-bottom: 1px solid #f0ebe4;
    }
    .profile-field .label {
      font-weight: 600;
      color: #6b5d4f;
      width: 180px;
      flex-shrink: 0;
      font-size: 13px;
    }
    .profile-field .value {
      color: #3d3530;
      font-size: 14px;
      line-height: 1.6;
    }

    /* ── CHAPTER PAGES ── */
    .chapter-page {
      padding: 60px;
      page-break-before: always;
    }
    .chapter-header {
      text-align: center;
      margin-bottom: 40px;
      padding-top: 40px;
    }
    .chapter-num {
      font-family: 'Cormorant Garamond', serif;
      font-size: 14px;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #b4966e;
    }
    .chapter-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 36px;
      font-weight: 600;
      color: #2d2520;
      margin-top: 8px;
      line-height: 1.3;
    }
    .chapter-divider {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #c4a882, transparent);
      margin: 20px auto 0;
    }
    .chapter-text {
      font-size: 14px;
      line-height: 1.9;
      color: #3d3530;
      text-align: justify;
      max-width: 600px;
      margin: 0 auto;
    }
    .chapter-text br + br { content: ''; display: block; margin-top: 16px; }

    /* ── BACK COVER ── */
    .back-cover {
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(160deg, #f7f3ee 0%, #e8ddd0 100%);
      text-align: center;
      page-break-before: always;
    }
    .back-logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 24px;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: #8b7355;
      margin-bottom: 16px;
    }
    .back-tagline {
      font-family: 'Cormorant Garamond', serif;
      font-size: 16px;
      font-style: italic;
      color: #8b7d6b;
    }

    @media print {
      body { margin: 0; }
      .cover, .back-cover { height: 100vh; }
      .chapter-page { break-inside: avoid-page; }
    }
  </style>
</head>
<body>

  <!-- COVER -->
  <div class="cover">
    <div class="cover-content">
      <div class="cover-ornament"></div>
      <div class="cover-logo">MYLEGACY</div>
      <h1 class="cover-title">${authorName}</h1>
      <p class="cover-subtitle">${t.cover}</p>
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

  <!-- BACK COVER -->
  <div class="back-cover">
    <div class="back-logo">MYLEGACY</div>
    <p class="back-tagline">${lang === "ru" ? "Сохраняя истории для будущих поколений" : "Preserving stories for future generations"}</p>
  </div>

</body>
</html>`;

      // Open in new window for printing/saving as PDF
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

      <main className="flex-1 px-6 pb-28 max-w-md mx-auto w-full flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <BookOpen size={32} className="text-primary" />
        </div>

        <h2 className="text-xl font-semibold text-foreground font-serif-display text-center mb-2">
          {lang === "ru" ? "Книга вашей жизни" : "Your Life Book"}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">{t.desc}</p>

        <div className="w-full space-y-3">
          {[
            {
              icon: <Sparkles size={20} className="text-primary" />,
              title: lang === "ru" ? "ИИ-нарратив" : "AI Narrative",
              desc: lang === "ru" ? "Все ответы объединяются в связный текст по главам" : "All answers are combined into cohesive text by chapter",
            },
            {
              icon: <BookOpen size={20} className="text-primary" />,
              title: lang === "ru" ? "12 глав жизни" : "12 Life Chapters",
              desc: lang === "ru" ? "Детство, семья, карьера, мудрость и другие" : "Childhood, family, career, wisdom and more",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4">
              <div className="flex-shrink-0">{item.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={generating}
          className="w-full flex flex-col items-center justify-center gap-1 bg-primary text-primary-foreground rounded-2xl py-4 mt-8 text-base font-medium transition-all active:scale-[0.97] disabled:opacity-40"
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
      </main>

      <BottomNav />
    </div>
  );
};

export default ExportPage;
