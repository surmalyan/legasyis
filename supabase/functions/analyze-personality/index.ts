import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { circle_id, lang } = await req.json();
    if (!circle_id) {
      return new Response(
        JSON.stringify({ error: "circle_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user is member/creator
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch circle info
    const { data: circle, error: circleError } = await supabase
      .from("memory_circles")
      .select("person_name, person_birth_year, person_death_year, description")
      .eq("id", circle_id)
      .single();

    if (circleError || !circle) {
      return new Response(JSON.stringify({ error: "Circle not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all memories
    const { data: memories, error: memError } = await supabase
      .from("circle_memories")
      .select("content, question")
      .eq("circle_id", circle_id);

    if (memError) {
      return new Response(JSON.stringify({ error: "Failed to fetch memories" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!memories || memories.length === 0) {
      return new Response(
        JSON.stringify({ error: "Not enough memories to generate a summary. Add more memories first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch members for context
    const { data: members } = await supabase
      .from("circle_members")
      .select("display_name, role_label")
      .eq("circle_id", circle_id)
      .eq("status", "active");

    const memberCount = (members?.length || 0) + 1; // +1 for creator

    // Build the prompt
    const isRu = lang === "ru";
    const personName = circle.person_name;
    const years = [circle.person_birth_year, circle.person_death_year].filter(Boolean).join("–");

    const memoriesText = memories
      .map((m, i) => {
        const q = m.question ? `Q: ${m.question}\n` : "";
        return `${q}Memory ${i + 1}: ${m.content}`;
      })
      .join("\n\n");

    const systemPrompt = isRu
      ? `Ты — чуткий аналитик воспоминаний. Твоя задача — проанализировать воспоминания людей о человеке и создать бережный портрет его личности.

ВАЖНЫЕ ПРАВИЛА:
- НЕ имитируй голос или речь умершего человека
- НЕ веди воображаемый диалог от его лица
- Фокусируйся на ОТРАЖЕНИИ, а не на имитации
- Будь тёплым, уважительным и деликатным
- Используй формулировки "по словам близких", "как вспоминают", "друзья отмечают"

Структурируй ответ СТРОГО в формате JSON с полями:
{
  "core_traits": ["список 3-5 ключевых черт характера"],
  "values": ["список 3-5 жизненных ценностей"],
  "emotional_patterns": ["список 3-5 эмоциональных паттернов"],
  "how_others_saw_them": ["список 3-5 наблюдений о том, как другие воспринимали этого человека"],
  "summary": "Краткий абзац-портрет (3-5 предложений)"
}`
      : `You are a sensitive memory analyst. Your task is to analyze people's memories of someone and create a careful portrait of their personality.

IMPORTANT RULES:
- Do NOT imitate the deceased person's voice or speech
- Do NOT create imaginary dialogue as them
- Focus on REFLECTION, not imitation
- Be warm, respectful, and delicate
- Use phrases like "according to loved ones", "as remembered by", "friends noted"

Structure your response STRICTLY as JSON with these fields:
{
  "core_traits": ["list of 3-5 core character traits"],
  "values": ["list of 3-5 life values"],
  "emotional_patterns": ["list of 3-5 emotional patterns"],
  "how_others_saw_them": ["list of 3-5 observations about how others perceived this person"],
  "summary": "A brief portrait paragraph (3-5 sentences)"
}`;

    const userPrompt = isRu
      ? `Проанализируй ${memories.length} воспоминаний от ${memberCount} человек о ${personName}${years ? ` (${years})` : ""}.

${memoriesText}`
      : `Analyze ${memories.length} memories from ${memberCount} people about ${personName}${years ? ` (${years})` : ""}.

${memoriesText}`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "personality_summary",
                description: "Return a structured personality summary",
                parameters: {
                  type: "object",
                  properties: {
                    core_traits: {
                      type: "array",
                      items: { type: "string" },
                      description: "3-5 core character traits",
                    },
                    values: {
                      type: "array",
                      items: { type: "string" },
                      description: "3-5 life values",
                    },
                    emotional_patterns: {
                      type: "array",
                      items: { type: "string" },
                      description: "3-5 emotional patterns",
                    },
                    how_others_saw_them: {
                      type: "array",
                      items: { type: "string" },
                      description: "3-5 observations about perception",
                    },
                    summary: {
                      type: "string",
                      description: "Brief portrait paragraph",
                    },
                  },
                  required: [
                    "core_traits",
                    "values",
                    "emotional_patterns",
                    "how_others_saw_them",
                    "summary",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "personality_summary" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: isRu ? "Слишком много запросов. Попробуйте позже." : "Rate limited. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: isRu ? "Кредиты AI исчерпаны." : "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI error:", status, await aiResponse.text());
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let result;
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content as JSON
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ ...result, person_name: personName }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-personality error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
