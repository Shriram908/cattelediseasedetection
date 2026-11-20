import { describe, expect, it } from 'vitest';
import { canViewAdmin, validTrendDays } from './admin-access';
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, validVector, validObservations } from '../../supabase/functions/_shared/semantic-validation';
describe('Admin and semantic search rules', () => {
  it('only permits a confirmed admin response', () => { expect(canViewAdmin(true)).toBe(true); expect(canViewAdmin(false)).toBe(false); expect(canViewAdmin('admin')).toBe(false); });
  it('restricts trend windows', () => { expect(validTrendDays(30)).toBe(true); expect(validTrendDays(100000)).toBe(false); });
  it('keeps full embedding dimensions and one model', () => { expect(EMBEDDING_MODEL).toBe('google/gemini-embedding-2'); expect(EMBEDDING_DIMENSIONS).toBe(3072); expect(validVector(Array(3072).fill(0.1))).toBe(true); expect(validVector(Array(1536).fill(0.1))).toBe(false); expect(validVector(Array(3072).fill(NaN))).toBe(false); });
  it('bounds farmer observations', () => { expect(validObservations('Cow has mouth blisters')).toBe(true); expect(validObservations('a'.repeat(2001))).toBe(false); });
});
import { DIAGNOSIS_PRICE_PAISE, validPaymentSignature, orderIsPaid, paymentIsCaptured } from "../../supabase/functions/_shared/payments";
import { createHmac } from "node:crypto";

describe("pay-per-diagnosis", () => {
  it("charges ₹99 per report", () => {
    expect(DIAGNOSIS_PRICE_PAISE).toBe(9900);
  });
  it("only unlocks a provider-paid INR order for the full ₹99", () => {
    const order = { status: "paid", amount: 9900, amount_paid: 9900, currency: "INR" };
    expect(orderIsPaid(order, 9900, "INR")).toBe(true);
    expect(orderIsPaid({ ...order, status: "attempted" }, 9900, "INR")).toBe(false);
    expect(orderIsPaid({ ...order, amount_paid: 9000 }, 9900, "INR")).toBe(false);
    expect(orderIsPaid({ ...order, currency: "USD" }, 9900, "INR")).toBe(false);
  });
  it("accepts captured payments only for the stored order and total", () => {
    const payment = { status: "captured", order_id: "order_1", amount: 9900, currency: "INR" };
    expect(paymentIsCaptured(payment, "order_1", 9900, "INR")).toBe(true);
    expect(paymentIsCaptured(payment, "order_2", 9900, "INR")).toBe(false);
    expect(paymentIsCaptured({ ...payment, status: "authorized" }, "order_1", 9900, "INR")).toBe(false);
    expect(paymentIsCaptured({ ...payment, amount: 9000 }, "order_1", 9900, "INR")).toBe(false);
  });
  it("accepts only Razorpay's genuine signature", async () => {
    const good = createHmac("sha256", "test_secret").update("order_1|pay_1").digest("hex");
    expect(await validPaymentSignature("order_1", "pay_1", good, "test_secret")).toBe(true);
    expect(await validPaymentSignature("order_1", "pay_2", good, "test_secret")).toBe(false);
    expect(await validPaymentSignature("order_1", "pay_1", good, "other_secret")).toBe(false);
  });
});
