/** Normalises a farmer-entered mobile number to E.164. Bare 10-digit numbers default to India (+91). */
export function toE164(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^\+[1-9]\d{7,14}$/.test(digits)) return digits;
  return null;
}

export const isValidOtp = (code: string) => /^\d{6}$/.test(code);
