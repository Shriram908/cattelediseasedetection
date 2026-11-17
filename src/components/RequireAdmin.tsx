import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { canViewAdmin } from "@/lib/admin-access";

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_admin");
      if (error) throw error;
      return canViewAdmin(data);
    },
    staleTime: 5 * 60_000,
  });
}

/** Server-verified admin gate; the database policies enforce the same rule independently. */
export default function RequireAdmin() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
