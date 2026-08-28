import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Resumen de consumo del usuario autenticado (validado en el backend). */
export const getUsageSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { loadUsage, resolveEntitlement } = await import("./usage.server");
    const supa = supabase as unknown as { from: (t: string) => any };
    const ent = await resolveEntitlement(supa, userId);
    const { summary } = await loadUsage(supa, userId, ent);
    return summary;
  });
