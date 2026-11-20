/** Price of one diagnosis report in paise (₹99). */
export const DIAGNOSIS_PRICE_PAISE = 9900;
export const DIAGNOSIS_CURRENCY = "INR";

/** Only provider-confirmed payment of the stored total can unlock a report. */
export function orderIsPaid(order: { status?: unknown; amount?: unknown; amount_paid?: unknown; currency?: unknown }, amount: number, currency: string) {
  return order.status === "paid" && order.amount === amount && order.amount_paid === amount && order.currency === currency;
}

export function paymentIsCaptured(payment: { status?: unknown; amount?: unknown; currency?: unknown; order_id?: unknown }, orderId: string, amount: number, currency: string) {
  return payment.status === "captured" && payment.order_id === orderId && payment.amount === amount && payment.currency === currency;
}

const RAZORPAY_ID = /^[A-Za-z0-9_]{1,64}$/;

export function validRazorpayId(value: unknown): value is string {
  return typeof value === "string" && RAZORPAY_ID.test(value);
}

export function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Checks Razorpay Checkout's signature: HMAC-SHA256(order_id|payment_id) with the key secret. */
export async function validPaymentSignature(orderId: string, paymentId: string, signature: unknown, secret: string) {
  if (typeof signature !== "string" || !/^[0-9a-f]{64}$/.test(signature)) return false;
  const expected = await hmacHex(secret, `${orderId}|${paymentId}`);
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
