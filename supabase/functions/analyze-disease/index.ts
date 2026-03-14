import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const symptoms = body.symptoms;
    const imageUrl = body.image_url || body.imageUrl;
    const cattleId = body.cattle_id || body.cattleId;

    console.log("Analyzing disease for cattle:", cattleId);
    console.log("Symptoms:", symptoms);
    console.log("Image URL:", imageUrl);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build the analysis prompt
    let analysisPrompt = `You are an expert veterinary AI specializing in cattle diseases. Analyze the following and provide an accurate diagnosis.`;

    if (symptoms && symptoms.length > 0) {
      analysisPrompt += `\n\nObserved symptoms:\n${symptoms.map((s: string, i: number) => `${i + 1}. ${s.replace(/_/g, " ")}`).join("\n")}`;
    }

    if (imageUrl) {
      analysisPrompt += `\n\nIMPORTANT: An image of the affected cattle has been provided. You MUST carefully examine this image to identify visual signs of disease such as skin lesions, lumps, swelling, discharge, posture abnormalities, coat condition, etc. The visual analysis should be the PRIMARY basis for your diagnosis when an image is provided. Do NOT ignore the image.`;
    }

    analysisPrompt += `\n\nProvide your diagnosis as a JSON object with these fields:
{
  "disease_name": "string",
  "confidence_score": number (0-1),
  "severity": "Mild|Moderate|Severe|Critical",
  "veterinarian_required": boolean,
  "urgency": "Low|Medium|High|Critical",
  "treatment_duration": "string",
  "description": "string (2-3 sentences explaining the disease in simple language)",
  "first_aid": ["step1", "step2", "step3"],
  "home_remedies": ["remedy1", "remedy2", "remedy3"],
  "precautions": ["precaution1", "precaution2", "precaution3"]
}

For "first_aid", provide 3-5 immediate emergency steps a farmer should take RIGHT NOW before a vet arrives. These should be simple, actionable steps like isolating the animal, providing clean water, keeping the animal calm, etc.`;

Consider: Lumpy Skin Disease, Mastitis, Foot-and-Mouth Disease, Foot Rot, Bloat, Pneumonia, Blackleg, Coccidiosis, Bovine Dermatophilosis, Ringworm, Bovine Papillomatosis, Rumen Acidosis, and others.
Respond ONLY with valid JSON.`;

    // Build messages array - use multimodal content when image is provided
    const userContent: any[] = [{ type: "text", text: analysisPrompt }];

    if (imageUrl) {
      userContent.push({
        type: "image_url",
        image_url: { url: imageUrl },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a veterinary AI expert specializing in cattle disease diagnosis from both symptoms and images. When an image is provided, analyze it carefully for visual disease indicators. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0]?.message?.content;
    if (!aiContent) throw new Error("No response from AI");

    console.log("AI Response:", aiContent);

    let diagnosis;
    try {
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, "").trim();
      diagnosis = JSON.parse(cleanedContent);
    } catch {
      console.error("Failed to parse AI response:", aiContent);
      throw new Error("Invalid AI response format");
    }

    if (!diagnosis.disease_name || diagnosis.confidence_score === undefined) {
      throw new Error("Incomplete diagnosis from AI");
    }

    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        cattle_id: cattleId,
        user_id: user.id,
        image_url: imageUrl || null,
        selected_symptoms: symptoms || [],
        predicted_disease: diagnosis.disease_name,
        confidence_score: diagnosis.confidence_score,
        ml_model_used: "Lovable AI - Gemini 2.5 Flash",
        severity: diagnosis.severity,
        veterinarian_recommended: diagnosis.veterinarian_required,
        treatment_notes: `Duration: ${diagnosis.treatment_duration}\n\nFirst Aid:\n${(diagnosis.first_aid || []).join("\n")}\n\nHome Remedies:\n${diagnosis.home_remedies.join("\n")}\n\nPrecautions:\n${diagnosis.precautions.join("\n")}`,
      })
      .select()
      .single();

    if (reportError) {
      console.error("Error saving report:", reportError);
      throw reportError;
    }

    console.log("Report saved:", report.id);

    return new Response(
      JSON.stringify({
        report_id: report.id,
        diagnosis: { ...diagnosis, report_id: report.id },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Disease analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
