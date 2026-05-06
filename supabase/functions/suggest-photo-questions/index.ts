import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_url, person_name, lang } = await req.json();
    if (!image_url) {
      return new Response(JSON.stringify({ error: "image_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isRu = lang === "ru";
    const subject = person_name || (isRu ? "близкого человека" : "a loved one");

    const systemPrompt = isRu
      ? `Ты — деликатный помощник, помогающий бережно собирать воспоминания о ${subject}.
Посмотри на фото и составь:
1) "gentle_nudge" — ОДИН тёплый, ностальгический, эмпатичный вопрос-«мягкое подталкивание». Он должен звучать как
   нежное приглашение вспомнить чувство момента, а не допрос. Используй мягкий, поэтичный, человечный тон
   (например: «Помните ли вы тот день?..», «Что вы почувствовали, увидев это снова?..»). Один-два предложения,
   максимум ~25 слов. Без штампов, без пафоса, без имитации голоса ушедшего.
2) "questions" — 3–4 коротких открытых дополнительных вопроса о деталях (место, люди, эмоции, эпоха, привычки).
3) "observations" — 2–3 коротких факта о том, что РЕАЛЬНО видно на фото (одежда, обстановка, эпоха).
Не выдумывай факты. Если детали неясны — спрашивай мягко.`
      : `You are a gentle, empathetic assistant helping someone carefully gather memories about ${subject}.
Looking at the photo, produce:
1) "gentle_nudge" — ONE warm, nostalgic, empathetic prompt. It must feel like a soft invitation to recall
   the FEELING of the moment, not an interrogation. Use a tender, slightly poetic, deeply human tone
   (e.g., "Do you remember the way the light fell that afternoon?..", "What does seeing this again bring back?..").
   One to two sentences, max ~25 words. No clichés, no melodrama, never impersonate the deceased.
2) "questions" — 3–4 short open-ended follow-up questions about details (place, people, emotions, era, habits).
3) "observations" — 2–3 short factual notes about what is ACTUALLY visible (clothing, setting, era).
Do not invent facts. If details are unclear, ask softly.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: isRu
                  ? "Посмотри на это фото и предложи вопросы для воспоминаний."
                  : "Look at this photo and suggest memory-prompting questions.",
              },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "photo_questions",
              description: "Return a gentle empathetic nudge plus observations and memory-prompting follow-ups",
              parameters: {
                type: "object",
                properties: {
                  gentle_nudge: {
                    type: "string",
                    description:
                      "ONE warm, nostalgic, empathetic single-sentence prompt that gently invites recalling the feeling of the moment.",
                  },
                  observations: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-4 short factual observations about what is visible",
                  },
                  questions: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 warm, open-ended follow-up questions",
                  },
                },
                required: ["gentle_nudge", "observations", "questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "photo_questions" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: isRu ? "Слишком много запросов. Попробуйте позже." : "Rate limited. Try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: isRu ? "Кредиты AI исчерпаны." : "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result: { observations: string[]; questions: string[] };
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      const m = content.match(/\{[\s\S]*\}/);
      if (!m) {
        return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      result = JSON.parse(m[0]);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-photo-questions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});