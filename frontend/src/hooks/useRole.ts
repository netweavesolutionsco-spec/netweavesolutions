import { useQuery } from "@tanstack/react-query";
import { getMyRole } from "@/lib/pages.functions";

export type Role = "admin" | "editor" | "viewer" | null;

/**
 * The current user's CMS role. Used to gate builder controls in the UI —
 * publish / delete / restore / global settings are admin-only, editors may
 * only edit content. The server functions enforce this too; this is just for
 * showing/hiding controls.
 */
export function useRole(): { role: Role; isAdmin: boolean; canEdit: boolean; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["cms-role"],
    queryFn: () => getMyRole(),
    staleTime: 5 * 60_000,
  });
  const role = (data?.role ?? null) as Role;
  return {
    role,
    isAdmin: role === "admin",
    canEdit: role === "admin" || role === "editor",
    isLoading,
  };
}
