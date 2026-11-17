export function validSymptoms(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 30 && value.every(s => typeof s === "string" && /^[a-z_]{1,80}$/.test(s));
}
export function ownedImageUrl(value: string, base: string, userId: string) {
  try {
    const url = new URL(value);
    return url.origin === new URL(base).origin && url.pathname.startsWith(`/storage/v1/object/public/cattle-images/${userId}/`) && !url.pathname.includes("..") && !url.search && !url.hash;
  } catch { return false; }
}
export function validChatMessages(value: unknown): value is { role: "user" | "assistant"; content: string }[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 30 && value.every(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0 && m.content.length <= 4000);
}
export function validTranslation(texts: unknown, language: unknown): texts is string[] {
  return ["en", "hi", "mr"].includes(String(language)) && Array.isArray(texts) && texts.length <= 60 && texts.every(t => typeof t === "string" && t.length <= 3000);
}