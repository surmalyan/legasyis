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
      ? `Ты — деликатный помощник, помогающий людям бережно собирать воспоминания о ${subject}.
Посмотри на фото и предложи 4–5 коротких, тёплых, открытых вопросов, которые помогут вспомнить детали:
место, людей, эмоции, эпоху, привычки, события вокруг этого момента.
Не имитируй голос ушедшего, не выдумывай факты. Опирайся только на то, что реально видно на фото
(одежда, обстановка, выражения лиц, эпоха), и формулируй вопросы к тому, кто помнит этот момент.
Если на фото неясные детали — задавай мягкие уточняющие вопросы.
Верни СТРОГО JSON: { "observations": ["короткое описание 1", ...], "questions": ["вопрос 1", ...] }`
      : `You are a gentle assistant helping people carefully gather memories about ${subject}.
Look at the photo and propose 4–5 short, warm, open-ended questions that help recall details:
place, people, emotions, era, habits, events around this moment.
Do NOT imitate the deceased's voice. Do NOT invent facts. Base questions only on what is actually
visible in the photo (clothing, setting, expressions, era), and address them to someone who remembers this moment.
If details are unclear, ask soft clarifying questions.
Return STRICT JSON: { "observations": ["short description 1", ...], "questions": ["question 1", ...] }`;

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
              description: "Return observations and memory-prompting questions",
              parameters: {
                type: "object",
                properties: {
                  observations: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-4 short factual observations about what is visible",
                  },
                  questions: {
                    type: "array",
                    items: { type: "string" },
                    description: "4-5 warm, open-ended questions",
                  },
                },
                required: ["observations", "questions"],
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