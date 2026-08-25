import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Resumen de consumo del usuario autenticado (validado en el backend). */
export const getUsageSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { loadUsage, resolvePlan } = await import("./usage.server");
    const supa = supabase as unknown as { from: (t: string) => any };
    const plan = await resolvePlan(supa, userId);
    const { summary } = await loadUsage(supa, userId, plan);
    return summary;
  });
