import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Download, Loader2, FileText, BookOpen } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const ExportPage = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);

  const t = {
    title: lang === "ru" ? "Экспорт" : "Export",
    desc: lang === "ru"
      ? "Скачайте свои истории и анкету как PDF-книгу"
      : "Download your stories and profile as a PDF book",
    generate: lang === "ru" ? "Создать PDF" : "Generate PDF",
    profileSection: lang === "ru" ? "Анкета наследника" : "Heir Profile",
    storiesSection: lang === "ru" ? "Мои истории" : "My Stories",
    noData: lang === "ru" ? "Нет данных для экспорта" : "No data to export",
  };

  const handleExport = async () => {
    if (!user) return;
    setGenerating(true);

    try {
      const [profileRes, entriesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("entries").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      ]);

      const profile = profileRes.data;
      const entries = entriesRes.data || [];

      if (!profile && entries.length === 0) {
        toast.error(t.noData);
        setGenerating(false);
        return;
      }

      // Generate printable HTML
      const labels = {
        full_name: lang === "ru" ? "Имя" : "Name",
        birth_date: lang === "ru" ? "Дата рождения" : "Date of Birth",
        city: lang === "ru" ? "Город" : "City",
        occupation: lang === "ru" ? "Род деятельности" : "Occupation",
        family: lang === "ru" ? "Семья" : "Family",
        hobbies: lang === "ru" ? "Увлечения" : "Hobbies",
        life_motto: lang === "ru" ? "Жизненное кредо" : "Life Motto",
        biggest_dream: lang === "ru" ? "Главная мечта" : "Biggest Dream",
        grateful_for: lang === "ru" ? "За что благодарны" : "Grateful For",
        advice_to_descendants: lang === "ru" ? "Совет потомкам" : "Advice to Descendants",
        would_change: lang === "ru" ? "Что бы изменили" : "What Would You Change",
      };

      const profileFields = profile
        ? Object.entries(labels)
            .filter(([key]) => profile[key as keyof typeof profile])
            .map(([key, label]) => `<div class="field"><strong>${label}:</strong> <span>${profile[key as keyof typeof profile]}</span></div>`)
            .join("")
        : "";

      const storiesHtml = entries
        .map((e) => {
          const date = new Date(e.created_at).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
            year: "numeric", month: "long", day: "numeric",
          });
          return `
            <div class="story">
              <div class="story-date">${date}</div>
              <div class="story-question">${e.question}</div>
              <div class="story-text">${e.ai_story.replace(/\n/g, "<br/>")}</div>
            </div>
          `;
        })
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>MYLEGACY</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400;500&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; color: #2d2520; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { font-family: 'Cormorant Garamond', serif; font-size: 32px; text-align: center; margin-bottom: 8px; color: #2d2520; }
            .subtitle { text-align: center; color: #8b7d6b; font-size: 14px; margin-bottom: 40px; }
            h2 { font-family: 'Cormorant Garamond', serif; font-size: 24px; margin: 32px 0 16px; color: #2d2520; border-bottom: 1px solid #e5ddd0; padding-bottom: 8px; }
            .field { margin: 8px 0; font-size: 14px; line-height: 1.6; }
            .field strong { color: #5a4f42; }
            .story { margin: 24px 0; padding: 20px; background: #faf8f5; border-radius: 12px; border: 1px solid #e5ddd0; }
            .story-date { font-size: 12px; color: #8b7d6b; margin-bottom: 4px; }
            .story-question { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #2d2520; }
            .story-text { font-size: 14px; line-height: 1.8; color: #3d3530; }
            @media print { body { padding: 20px; } .story { break-inside: avoid; } }
          </style>
        </head>
        <body>
          <h1>MYLEGACY</h1>
          <p class="subtitle">${profile?.full_name || ""}</p>
          ${profileFields ? `<h2>${t.profileSection}</h2>${profileFields}` : ""}
          ${storiesHtml ? `<h2>${t.storiesSection}</h2>${storiesHtml}` : ""}
        </body>
        </html>
      `;

      // Open in new window for printing/saving as PDF
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 500);
      }

      toast.success(lang === "ru" ? "PDF готов к печати!" : "PDF ready to print!");
    } catch {
      toast.error(lang === "ru" ? "Ошибка генерации" : "Generation failed");
    } finally {
      setGenerating(false);
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
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4">
            <FileText size={20} className="text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t.profileSection}</p>
              <p className="text-xs text-muted-foreground">
                {lang === "ru" ? "Имя, город, мечты, советы" : "Name, city, dreams, advice"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-4">
            <BookOpen size={20} className="text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t.storiesSection}</p>
              <p className="text-xs text-muted-foreground">
                {lang === "ru" ? "Все ваши записанные истории" : "All your recorded stories"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 mt-8 text-base font-medium transition-all active:scale-[0.97] disabled:opacity-40"
        >
          {generating ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <>
              <Download size={20} />
              {t.generate}
            </>
          )}
        </button>
      </main>

      <BottomNav />
    </div>
  );
};

export default ExportPage;
