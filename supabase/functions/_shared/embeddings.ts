import { RequestError } from './security.ts';
import { EMBEDDING_MODEL, validVector } from './semantic-validation.ts';

export async function embed(input: string[]) {
  // Short curated disease records and bounded observations fit the 8192-token input ceiling.
  if (!input.length || input.length > 100 || input.some(s => !s.trim() || new TextEncoder().encode(s).length > 7000)) throw new RequestError('Embedding input is too large');
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new RequestError('Semantic search is not configured', 503);
  const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new RequestError(result.message || result.error?.message || 'Semantic search is temporarily unavailable', response.status);
  const ordered: number[][] = Array(input.length);
  for (const item of result.data ?? []) {
    if (!Number.isInteger(item.index) || item.index < 0 || item.index >= input.length || ordered[item.index] || !validVector(item.embedding)) throw new RequestError('Invalid semantic search response', 502);
    ordered[item.index] = item.embedding;
  }
  for (let i = 0; i < input.length; i++) if (!ordered[i]) throw new RequestError('Missing semantic search response', 502);
  return ordered;
}