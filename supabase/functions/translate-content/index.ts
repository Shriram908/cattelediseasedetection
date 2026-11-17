import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { authenticate, readBody, corsHeaders, RequestError, errorResponse } from "../_shared/security.ts";
import { validTranslation } from "../_shared/validation.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await authenticate(req);
    const { texts, targetLanguage } = await readBody(req);
    if (!validTranslation(texts, targetLanguage)) throw new RequestError("Invalid translation input");
    if (targetLanguage === "en" || texts.length === 0) {
      return new Response(JSON.stringify({ translated: texts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langName = targetLanguage === "hi" ? "Hindi" : targetLanguage === "mr" ? "Marathi" : targetLanguage;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a translator. Translate the given JSON array of strings from English to ${langName}. Keep medical/veterinary terms accurate. Return ONLY a JSON array of translated strings in the same order. No explanation.`,
          },
          {
            role: "user",
            content: JSON.stringify(texts),
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const translated = JSON.parse(cleaned);
    if (!Array.isArray(translated) || translated.length !== texts.length || translated.some(t => typeof t !== "string")) throw new Error("Invalid translation output");

    return new Response(JSON.stringify({ translated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return errorResponse(e);
  }
});
