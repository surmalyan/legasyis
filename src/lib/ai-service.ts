import { supabase } from "@/integrations/supabase/client";

export async function transcribeAudio(
  audioBlob: Blob,
  lang: "ru" | "en"
): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("lang", lang);

  const { data, error } = await supabase.functions.invoke("transcribe", {
    body: formData,
  });

  if (error) throw new Error(error.message || "Transcription failed");
  if (data?.error) {
    if (data.error === "rate_limited") throw new Error("rate_limited");
    if (data.error === "payment_required") throw new Error("payment_required");
    throw new Error(data.error);
  }

  return data.text || "";
}

export async function generateAIStory(
  text: string,
  question: string,
  lang: "ru" | "en"
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-story", {
    body: { text, question, lang },
  });

  if (error) throw new Error(error.message || "Story generation failed");
  if (data?.error) {
    if (data.error === "rate_limited") throw new Error("rate_limited");
    if (data.error === "payment_required") throw new Error("payment_required");
    throw new Error(data.error);
  }

  return data.ai_story || "";
}
