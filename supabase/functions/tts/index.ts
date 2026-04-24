import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Gemini TTS voice presets — multilingual, work for te / hi / en
const VOICE_BY_LANG: Record<string, string> = {
  en: "Kore",
  hi: "Kore",
  te: "Kore",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, language = "en" } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const voiceName = VOICE_BY_LANG[language] || "Kore";
    const langName = language === "te" ? "Telugu" : language === "hi" ? "Hindi" : "English";

    // Use Gemini TTS via Lovable AI gateway (OpenAI-compatible chat completions with audio modality)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-preview-tts",
        modalities: ["audio"],
        audio: { voice: voiceName, format: "wav" },
        messages: [
          {
            role: "user",
            content: `Read the following ${langName} text aloud naturally in ${langName}: ${text}`,
          },
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit. Wait a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("TTS gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "TTS gateway error", detail: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    // Extract base64 audio from OpenAI-compatible response
    const audioB64 =
      data.choices?.[0]?.message?.audio?.data ||
      data.choices?.[0]?.message?.audio ||
      null;

    if (!audioB64 || typeof audioB64 !== "string") {
      console.error("No audio in response", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "No audio returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ audio: audioB64, mime: "audio/wav" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tts error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
