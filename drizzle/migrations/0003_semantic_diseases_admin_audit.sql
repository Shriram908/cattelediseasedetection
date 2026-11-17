ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE TABLE public.disease_embeddings (
 disease_id uuid PRIMARY KEY REFERENCES public.diseases(id) ON DELETE CASCADE,
 content text NOT NULL,
 embedding extensions.vector(3072) NOT NULL,
 model text NOT NULL DEFAULT 'google/gemini-embedding-2',
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.disease_embeddings TO authenticated;
GRANT ALL ON public.disease_embeddings TO service_role;
ALTER TABLE public.disease_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in readers" ON public.disease_embeddings FOR SELECT TO authenticated USING (true);
CREATE INDEX disease_embedding_hnsw ON public.disease_embeddings USING hnsw ((embedding::extensions.halfvec(3072)) extensions.halfvec_cosine_ops);
CREATE FUNCTION public.match_diseases(query_embedding extensions.vector(3072), match_count integer DEFAULT 5)
RETURNS TABLE (disease_id uuid, similarity double precision)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, extensions AS $$
 SELECT e.disease_id, 1 - (e.embedding::halfvec(3072) <=> query_embedding::halfvec(3072)) FROM public.disease_embeddings e WHERE e.model = 'google/gemini-embedding-2' ORDER BY e.embedding::halfvec(3072) <=> query_embedding::halfvec(3072) LIMIT greatest(1, least(match_count, 5));
$$;
REVOKE ALL ON FUNCTION public.match_diseases(extensions.vector, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_diseases(extensions.vector, integer) TO authenticated, service_role;
CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role::text = 'admin'); $$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
CREATE POLICY "Admins view diagnoses" ON public.reports FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins view signup profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins view cattle" ON public.cattle FOR SELECT TO authenticated USING (public.is_admin());
CREATE TABLE public.chatbot_queries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 query text NOT NULL CHECK (char_length(query) BETWEEN 1 AND 4000),
 language text NOT NULL CHECK (language IN ('en','hi','mr')),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chatbot_queries TO authenticated;
GRANT ALL ON public.chatbot_queries TO service_role;
ALTER TABLE public.chatbot_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin chatbot reads" ON public.chatbot_queries FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE INDEX chatbot_queries_created ON public.chatbot_queries(created_at DESC);
COMMENT ON TABLE public.disease_embeddings IS 'Semantic retrieval index of curated diseases; full 3072 dimensions.';
COMMENT ON TABLE public.chatbot_queries IS 'New chatbot questions recorded server-side; no historical questions exist before this change.';