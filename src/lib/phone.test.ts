import { describe, expect, it } from "vitest";
import { isValidOtp, toE164 } from "./phone";

describe("mobile OTP rules", () => {
  it("defaults 10-digit Indian mobiles to +91", () => expect(toE164("98765 43210")).toBe("+919876543210"));
  it("keeps valid international numbers", () => expect(toE164("+14155550123")).toBe("+14155550123"));
  it("rejects malformed numbers", () => { expect(toE164("12345")).toBeNull(); expect(toE164("0987654321")).toBeNull(); });
  it("requires a 6-digit code", () => { expect(isValidOtp("123456")).toBe(true); expect(isValidOtp("12345")).toBe(false); });
});
