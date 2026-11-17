import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticate, readBody, corsHeaders, jsonResponse, RequestError, errorResponse } from "../_shared/security.ts";
import { DIAGNOSIS_CURRENCY, DIAGNOSIS_PRICE_PAISE, validPaymentSignature, validRazorpayId, validUuid } from "../_shared/payments.ts";

const keyId = (Deno.env.get("RAZORPAY_KEY_ID") ?? "").trim();
const keySecret = (Deno.env.get("RAZORPAY_KEY_SECRET") ?? "").trim();

async function createOrder(admin: ReturnType<typeof createClient>, userId: string, reportId: unknown) {
  if (!validUuid(reportId)) throw new RequestError("Invalid report");
  const { data: report, error } = await admin.from("reports").select("id, unlocked").eq("id", reportId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!report) throw new RequestError("Report not found", 404);
  if (report.unlocked) return { unlocked: true };

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: DIAGNOSIS_PRICE_PAISE, currency: DIAGNOSIS_CURRENCY, receipt: reportId, notes: { report_id: reportId, user_id: userId } }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    console.error("Razorpay order failed:", response.status);
    throw new RequestError("Payment service is unavailable. Please try again.", 502);
  }
  const order = await response.json();
  const { error: insertError } = await admin.from("diagnosis_payments").insert({
    report_id: reportId, user_id: userId, razorpay_order_id: order.id, amount_paise: DIAGNOSIS_PRICE_PAISE, currency: DIAGNOSIS_CURRENCY,
  });
  if (insertError) throw insertError;
  return { unlocked: false, order_id: order.id, amount: DIAGNOSIS_PRICE_PAISE, currency: DIAGNOSIS_CURRENCY, key_id: keyId };
}

async function verifyPayment(admin: ReturnType<typeof createClient>, userId: string, body: Record<string, unknown>) {
  const { order_id: orderId, payment_id: paymentId, signature } = body;
  if (!validRazorpayId(orderId) || !validRazorpayId(paymentId)) throw new RequestError("Invalid payment details");
  const { data: payment, error } = await admin.from("diagnosis_payments").select("id, report_id, status").eq("razorpay_order_id", orderId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!payment) throw new RequestError("Payment not found", 404);
  if (!(await validPaymentSignature(orderId, paymentId, signature, keySecret))) throw new RequestError("Payment could not be verified", 400);

  if (payment.status !== "paid") {
    const { error: payError } = await admin.from("diagnosis_payments").update({ status: "paid", razorpay_payment_id: paymentId, paid_at: new Date().toISOString() }).eq("id", payment.id);
    if (payError) throw payError;
  }
  const { error: unlockError } = await admin.from("reports").update({ unlocked: true }).eq("id", payment.report_id);
  if (unlockError) throw unlockError;
  return { unlocked: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { user } = await authenticate(req);
    if (!keyId || !keySecret) throw new RequestError("Payments are not configured yet", 503);
    const body = await readBody(req);
    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
    if (body.action === "create_order") return jsonResponse(await createOrder(admin, user.id, body.report_id));
    if (body.action === "verify") return jsonResponse(await verifyPayment(admin, user.id, body));
    throw new RequestError("Unknown action");
  } catch (error) {
    return errorResponse(error);
  }
});
