import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticate, readBody, corsHeaders, jsonResponse, RequestError, errorResponse } from "../_shared/security.ts";
import { DIAGNOSIS_CURRENCY, DIAGNOSIS_PRICE_PAISE, validRazorpayId, validUuid } from "../_shared/payments.ts";
import { razorpay, razorpayConfig, confirmPayment } from "../_shared/razorpay-service.ts";

// deno-lint-ignore no-explicit-any
type AdminClient = any;

async function createOrder(admin: AdminClient, userId: string, reportId: unknown) {
  if (!validUuid(reportId)) throw new RequestError("Invalid report");
  const { data: report, error } = await admin.from("reports").select("id, unlocked").eq("id", reportId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!report) throw new RequestError("Report not found", 404);
  if (report.unlocked) return { unlocked: true };

  const { data: existing, error: existingError } = await admin.from("diagnosis_payments").select("*").eq("report_id", reportId).eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    try {
      const result = await confirmPayment(admin, existing);
      if (result.unlocked) return result;
      return { unlocked: false, order_id: existing.razorpay_order_id, amount: existing.amount_paise, currency: existing.currency, key_id: razorpayConfig().keyId };
    } catch (error) {
      // Orders from a replaced Razorpay account cannot be reused; all other failures remain visible.
      if (!(error instanceof RequestError) || error.status !== 404) throw error;
    }
  }
  const order = await razorpay("orders", { amount: DIAGNOSIS_PRICE_PAISE, currency: DIAGNOSIS_CURRENCY, receipt: reportId, notes: { report_id: reportId, user_id: userId } });
  if (!validRazorpayId(order.id) || order.amount !== DIAGNOSIS_PRICE_PAISE || order.currency !== DIAGNOSIS_CURRENCY) throw new RequestError("Razorpay returned an invalid order", 502);
  const { error: insertError } = await admin.from("diagnosis_payments").insert({
    report_id: reportId, user_id: userId, razorpay_order_id: order.id, amount_paise: DIAGNOSIS_PRICE_PAISE, currency: DIAGNOSIS_CURRENCY,
  });
  if (insertError) throw insertError;
  return { unlocked: false, order_id: order.id, amount: DIAGNOSIS_PRICE_PAISE, currency: DIAGNOSIS_CURRENCY, key_id: razorpayConfig().keyId };
}

async function verifyPayment(admin: AdminClient, userId: string, body: Record<string, unknown>) {
  const { order_id: orderId } = body;
  if (!validRazorpayId(orderId)) throw new RequestError("Invalid payment details");
  const { data: payment, error } = await admin.from("diagnosis_payments").select("*").eq("razorpay_order_id", orderId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!payment) throw new RequestError("Payment not found", 404);
  return confirmPayment(admin, payment);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { user } = await authenticate(req);
    razorpayConfig();
    const body = await readBody(req);
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
    if (body.action === "create_order") return jsonResponse(await createOrder(admin, user.id, body.report_id));
    if (body.action === "verify") return jsonResponse(await verifyPayment(admin, user.id, body));
    if (body.action === "check_report") {
      if (!validUuid(body.report_id)) throw new RequestError("Invalid report");
      const { data, error } = await admin.from("diagnosis_payments").select("*").eq("report_id", body.report_id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      try { return jsonResponse(data ? await confirmPayment(admin, data) : { unlocked: false }); }
      catch (error) {
        if (error instanceof RequestError && error.status === 404) return jsonResponse({ unlocked: false });
        throw error;
      }
    }
    throw new RequestError("Unknown action");
  } catch (error) {
    return errorResponse(error);
  }
});
