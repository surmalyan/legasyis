import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHAPTERS = [
  "childhood",
  "family",
  "career",
  "values",
  "dreams",
  "travel",
  "gratitude",
  "wisdom",
  "daily_life",
  "relationships",
  "memories",
  "reflections",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, question, lang } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt =
      lang === "ru"
        ? `Ты помощник для классификации текстов по главам автобиографии. 
Прочитай ответ человека на вопрос и определи, к какой главе он относится.
Верни ТОЛЬКО название главы из списка: ${CHAPTERS.join(", ")}.
Ничего кроме названия главы.`
        : `You are a helper that classifies autobiography texts into chapters.
Read the person's answer and determine which chapter it belongs to.
Return ONLY the chapter name from this list: ${CHAPTERS.join(", ")}.
Nothing else but the chapter name.`;

    const userMessage = question
      ? `Question: "${question}"\n\nAnswer:\n${text}`
      : text;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

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

      return new Response(
        JSON.stringify({ error: "classification_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const raw = result.choices?.[0]?.message?.content?.trim().toLowerCase() || "";
    
    // Match to valid chapter or default
    const chapter = CHAPTERS.find((c) => raw.includes(c)) || "reflections";

    return new Response(JSON.stringify({ chapter, ai_story: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
