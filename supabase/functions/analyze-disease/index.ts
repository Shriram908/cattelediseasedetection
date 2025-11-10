import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiagnosisRequest {
  symptoms?: string[];
  imageUrl?: string;
  cattleId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { symptoms, imageUrl, cattleId }: DiagnosisRequest = await req.json();

    console.log("Analyzing disease for cattle:", cattleId);
    console.log("Symptoms provided:", symptoms);
    console.log("Image URL:", imageUrl);

    // Build comprehensive analysis prompt
    let analysisPrompt = `You are an expert veterinary AI specializing in cattle diseases. Analyze the following information and provide a diagnosis.

Available symptoms:`;

    if (symptoms && symptoms.length > 0) {
      analysisPrompt += `\n\nObserved symptoms:\n${symptoms.map((s, i) => `${i + 1}. ${s.replace(/_/g, " ")}`).join("\n")}`;
    }

    if (imageUrl) {
      analysisPrompt += `\n\nNote: An image has been provided for visual analysis.`;
    }

    analysisPrompt += `\n\nYour task:
1. Identify the most likely cattle disease based on the symptoms provided
2. Provide a confidence score (0-100)
3. Determine severity level: Mild, Moderate, Severe, or Critical
4. Indicate if veterinarian visit is required (true/false)
5. If vet is required, specify urgency: Low, Medium, High, or Critical
6. Suggest treatment duration
7. List 3-5 home remedies (simple, practical steps)
8. List 3-5 precautions to prevent disease spread
9. Provide a brief description of the disease

Consider these common cattle diseases: Mastitis, Foot-and-Mouth Disease, Foot Rot, Bloat, Pneumonia, Blackleg, Coccidiosis, Listeriosis, Rumen Acidosis, and others.

Respond ONLY with a valid JSON object in this exact format:
{
  "disease_name": "string",
  "confidence_score": number (0-1),
  "severity": "Mild|Moderate|Severe|Critical",
  "veterinarian_required": boolean,
  "urgency": "Low|Medium|High|Critical",
  "treatment_duration": "string",
  "description": "string",
  "home_remedies": ["remedy1", "remedy2", "remedy3"],
  "precautions": ["precaution1", "precaution2", "precaution3"]
}`;

    // Call Lovable AI for analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
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
            content: "You are a veterinary AI expert. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        temperature: 0.3,
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
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No response from AI");
    }

    console.log("AI Response:", aiContent);

    // Parse AI response
    let diagnosis;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, "").trim();
      diagnosis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      throw new Error("Invalid AI response format");
    }

    // Validate diagnosis structure
    if (!diagnosis.disease_name || diagnosis.confidence_score === undefined) {
      throw new Error("Incomplete diagnosis from AI");
    }

    // Save diagnosis to database
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
        treatment_notes: `Duration: ${diagnosis.treatment_duration}\n\nHome Remedies:\n${diagnosis.home_remedies.join("\n")}\n\nPrecautions:\n${diagnosis.precautions.join("\n")}`,
      })
      .select()
      .single();

    if (reportError) {
      console.error("Error saving report:", reportError);
      throw reportError;
    }

    console.log("Report saved successfully:", report.id);

    return new Response(
      JSON.stringify({
        report_id: report.id,
        diagnosis: {
          ...diagnosis,
          report_id: report.id,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Disease analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});