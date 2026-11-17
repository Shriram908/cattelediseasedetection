import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function RequireAuth() {
  const [state, setState] = useState<"loading" | "signed-in" | "signed-out">("loading");
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    let account: string | undefined;
    const update = (id?: string) => {
      if (!active) return;
      if (account !== id) queryClient.clear();
      account = id;
      setState(id ? "signed-in" : "signed-out");
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => update(session?.user.id));
    supabase.auth.getSession().then(({ data, error }) => update(error ? undefined : data.session?.user.id)).catch(() => update());
    return () => { active = false; subscription.unsubscribe(); };
  }, [queryClient]);
  if (state === "loading") return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" /></div>;
  return state === "signed-in" ? <Outlet /> : <Navigate to="/auth" replace />;
}