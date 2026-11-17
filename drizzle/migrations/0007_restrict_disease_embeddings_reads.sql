DROP POLICY IF EXISTS "Signed in readers" ON public.disease_embeddings;
REVOKE ALL ON public.disease_embeddings FROM anon, authenticated;
GRANT ALL ON public.disease_embeddings TO service_role;

CREATE OR REPLACE FUNCTION public.match_diseases(query_embedding extensions.vector, match_count integer DEFAULT 5)
 RETURNS TABLE(disease_id uuid, similarity double precision)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
 SELECT e.disease_id, 1 - (e.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) FROM public.disease_embeddings e WHERE auth.uid() IS NOT NULL AND e.model = 'google/gemini-embedding-2' ORDER BY e.embedding::halfvec(3072) <=> query_embedding::halfvec(3072) LIMIT greatest(1, least(match_count, 5));
$function$;

REVOKE ALL ON FUNCTION public.match_diseases(extensions.vector, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_diseases(extensions.vector, integer) TO authenticated, service_role;