import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Elimina de forma definitiva la cuenta del usuario autenticado y todos sus
 * datos asociados (perros, recetas, alacena, historial…). Requisito de
 * Apple App Store y Google Play.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as {
      from: (t: string) => any;
      auth: { admin: { deleteUser: (id: string) => Promise<{ error: unknown }> } };
    };

    const userTables = [
      "ai_conversations",
      "generated_recipes",
      "usage_counters",
      "notifications",
      "achievements",
      "weight_records",
      "weekly_plans",
      "shopping_lists",
      "pantry_items",
      "favorites",
      "prepared_recipes",
      "subscriptions",
      "dogs",
      "profiles",
    ];

    for (const table of userTables) {
      try {
        await admin.from(table).delete().eq("user_id", userId);
      } catch {
        /* la tabla puede no existir o no tener user_id: continuar */
      }
    }
    try {
      await admin.from("profiles").delete().eq("id", userId);
    } catch {
      /* ignorar */
    }

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      throw new Error(
        "No pudimos eliminar la cuenta automáticamente. Escríbenos a soporte@arimundomascotas.com y la borraremos en menos de 48 horas.",
      );
    }
    return { ok: true as const };
  });
