import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHAPTER_LABELS: Record<string, Record<string, string>> = {
  ru: {
    childhood: "Детство",
    family: "Семья",
    relationships: "Отношения",
    career: "Карьера и призвание",
    daily_life: "Повседневная жизнь",
    travel: "Путешествия и приключения",
    dreams: "Мечты и стремления",
    values: "Ценности и убеждения",
    gratitude: "Благодарность",
    wisdom: "Мудрость и уроки",
    memories: "Воспоминания",
    reflections: "Размышления",
  },
  en: {
    childhood: "Childhood",
    family: "Family",
    relationships: "Relationships",
    career: "Career & Calling",
    daily_life: "Daily Life",
    travel: "Travel & Adventures",
    dreams: "Dreams & Aspirations",
    values: "Values & Beliefs",
    gratitude: "Gratitude",
    wisdom: "Wisdom & Lessons",
    memories: "Memories",
    reflections: "Reflections",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chapters, profile, lang } = await req.json();
    // chapters: Record<string, Array<{question: string, answer: string}>>
    // profile: { full_name, birth_date, city, ... }

    if (!chapters || Object.keys(chapters).length === 0) {
      return new Response(JSON.stringify({ error: "No chapters provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const results: Record<string, string> = {};

    // Process each chapter with AI to create a cohesive narrative
    for (const [chapterKey, entries] of Object.entries(chapters)) {
      const entriesArr = entries as Array<{ question: string; answer: string }>;
      if (entriesArr.length === 0) continue;

      const chapterTitle = CHAPTER_LABELS[lang]?.[chapterKey] || chapterKey;
      const authorName = profile?.full_name || "";

      const qaPairs = entriesArr
        .map((e, i) => `${i + 1}. Вопрос: "${e.question}"\n   Ответ: "${e.answer}"`)
        .join("\n\n");

      const systemPrompt =
        lang === "ru"
          ? `Ты литературный редактор автобиографии. Тебе даны ответы человека${authorName ? ` по имени ${authorName}` : ""} на вопросы о главе "${chapterTitle}".

Твоя задача — объединить все ответы в единый связный текст главы автобиографии. Правила:
- Сохраняй оригинальные слова и мысли автора максимально близко к первоисточнику
- Объединяй ответы в плавный, читаемый текст без нумерации и перечислений
- Используй переходы между мыслями, чтобы текст читался как единая история
- НЕ добавляй фактов, которых нет в ответах
- НЕ приукрашивай и не фантазируй — только то, что сказал автор
- Пиши от первого лица
- Текст должен быть тёплым и искренним, как если бы человек рассказывал свою историю потомкам`
          : `You are a literary editor of an autobiography. You are given answers from a person${authorName ? ` named ${authorName}` : ""} about the chapter "${chapterTitle}".

Your task — combine all answers into a single cohesive chapter text. Rules:
- Preserve the author's original words and thoughts as closely as possible
- Combine answers into smooth, readable text without numbering or lists
- Use transitions between thoughts so the text reads as a single story
- Do NOT add facts that aren't in the answers
- Do NOT embellish or fantasize — only what the author said
- Write in first person
- The text should be warm and sincere, as if someone is telling their story to descendants`;

      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: qaPairs },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI error for chapter ${chapterKey}:`, response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "rate_limited" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "payment_required" }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Use raw text as fallback
        results[chapterKey] = entriesArr.map((e) => e.answer).join("\n\n");
        continue;
      }

      const result = await response.json();
      const narrative = result.choices?.[0]?.message?.content?.trim() || "";
      results[chapterKey] = narrative || entriesArr.map((e) => e.answer).join("\n\n");
    }

    return new Response(JSON.stringify({ chapters: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-book error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
