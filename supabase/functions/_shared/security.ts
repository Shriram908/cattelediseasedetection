import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export class RequestError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

export async function authenticate(req: Request) {
  if (req.method !== "POST") throw new RequestError("Method not allowed", 405);
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) throw new RequestError("Please sign in to continue", 401);
  const client = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
    global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(authorization.slice(7));
  if (error || !data.user) throw new RequestError("Please sign in to continue", 401);
  return { client, user: data.user };
}

export async function readBody(req: Request) {
  const raw = await req.text();
  if (raw.length > 100_000) throw new RequestError("Request is too large", 413);
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new RequestError("Invalid request body"); }
}

export function errorResponse(error: unknown) {
  if (error instanceof RequestError) return jsonResponse({ error: error.message }, error.status);
  console.error("Request failed:", error instanceof Error ? error.name : "Unknown error");
  return jsonResponse({ error: "Unable to complete this request. Please try again." }, 500);
}