import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticate, readBody, corsHeaders, RequestError, errorResponse, jsonResponse } from '../_shared/security.ts';
import { embed } from '../_shared/embeddings.ts';
import { diseaseContent, EMBEDDING_MODEL } from '../_shared/semantic-validation.ts';

serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const { client } = await authenticate(req);
    const { data: admin, error: roleError } = await client.rpc('is_admin');
    if (roleError || !admin) throw new RequestError('Administrator access required', 403);
    await readBody(req);
    const writer = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });
    const { data: diseases, error } = await client.from('diseases').select('id,name,description,symptoms');
    if (error || !diseases?.length) throw new RequestError('Disease references are unavailable', 503);
    let indexed = 0;
    for (let start = 0; start < diseases.length; start += 20) {
      const batch = diseases.slice(start, start + 20);
      const contents = batch.map(diseaseContent);
      const vectors = await embed(contents);
      const { error: saveError } = await writer.from('disease_embeddings').upsert(batch.map((d, i) => ({ disease_id: d.id, content: contents[i], embedding: JSON.stringify(vectors[i]), model: EMBEDDING_MODEL, updated_at: new Date().toISOString() })));
      if (saveError) throw new RequestError('Could not save the semantic index', 500);
      indexed += batch.length;
    }
    return jsonResponse({ indexed });
  } catch (error) { return errorResponse(error); }
});