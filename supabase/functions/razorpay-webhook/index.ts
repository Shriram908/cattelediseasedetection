import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { readBody, jsonResponse, errorResponse } from "../_shared/security.ts";
import { validRazorpayId } from "../_shared/payments.ts";
import { confirmPayment } from "../_shared/razorpay-service.ts";

serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  try {
    const body = await readBody(req);
    const orderId = body.payload?.payment?.entity?.order_id ?? body.payload?.order?.entity?.id;
    if (!validRazorpayId(orderId)) return jsonResponse({ received: true });
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
    const { data, error } = await admin.from("diagnosis_payments").select("*").eq("razorpay_order_id", orderId).maybeSingle();
    if (error) throw error;
    // Public events are hints only: proof always comes from Razorpay's order read.
    if (data) await confirmPayment(admin, data);
    return jsonResponse({ received: true });
  } catch (error) {
    console.error("Webhook confirmation failed", error instanceof Error ? error.message : "Unknown error");
    const response = errorResponse(error);
    return new Response(response.body, { status: 503, headers: response.headers });
  }
});