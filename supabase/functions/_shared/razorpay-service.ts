import { RequestError } from "./security.ts";
import { orderIsPaid, paymentIsCaptured } from "./payments.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/razorpay";
// The payment writer is service-scoped; every browser entry checks ownership first.
// deno-lint-ignore no-explicit-any
export type PaymentClient = any;

export function razorpayConfig() {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const connectionKey = Deno.env.get("RAZORPAY_CONNECTION_KEY");
  const keyId = Deno.env.get("RAZORPAY_CONNECTION_KEY_ID");
  if (!lovableKey || !connectionKey || !keyId) throw new RequestError("Payments are not set up yet", 503);
  return { lovableKey, connectionKey, keyId };
}

export async function razorpay(path: string, body?: Record<string, unknown>) {
  const { lovableKey, connectionKey } = razorpayConfig();
  const response = await fetch(`${GATEWAY_URL}/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connectionKey, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) {
    const details = await response.text();
    console.error(`Razorpay failed [${response.status}]: ${details}`);
    throw new RequestError(`Razorpay [${response.status}]: ${details}`, response.status);
  }
  return response.json();
}

export async function confirmPayment(admin: PaymentClient, payment: { id: string; report_id: string; razorpay_order_id: string; amount_paise: number; currency: string; status: string }) {
  if (payment.status !== "paid") {
    const order = await razorpay(`orders/${payment.razorpay_order_id}`);
    let paid = orderIsPaid(order, payment.amount_paise, payment.currency);
    let paymentId: string | undefined;
    if (!paid && order.status === "attempted") {
      const payments = await razorpay(`orders/${payment.razorpay_order_id}/payments`);
      const authorized = payments.items?.find((item: { status: string; order_id: string; amount: number; currency: string }) => item.status === "authorized" && item.order_id === payment.razorpay_order_id && item.amount === payment.amount_paise && item.currency === payment.currency);
      if (authorized) {
        const captured = await razorpay(`payments/${authorized.id}/capture`, { amount: payment.amount_paise, currency: payment.currency });
        paid = paymentIsCaptured(captured, payment.razorpay_order_id, payment.amount_paise, payment.currency);
        if (paid) paymentId = captured.id;
      }
    }
    if (!paid) return { unlocked: false };
    const { error } = await admin.from("diagnosis_payments").update({ status: "paid", paid_at: new Date().toISOString(), ...(paymentId ? { razorpay_payment_id: paymentId } : {}) }).eq("id", payment.id).eq("status", "created");
    if (error) throw error;
  }
  // Idempotent, including recovery if the first unlock write failed after payment was saved.
  const { error } = await admin.from("reports").update({ unlocked: true }).eq("id", payment.report_id).eq("unlocked", false);
  if (error) throw error;
  return { unlocked: true };
}