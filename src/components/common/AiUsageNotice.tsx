import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getUsageSummary } from "@/lib/usage.functions";
import {
  LIMIT_REACHED_HELP,
  LIMIT_REACHED_MESSAGE,
  TRIAL_LIMIT_REACHED_HELP,
  TRIAL_LIMIT_REACHED_MESSAGE,
  usageLabel,
  type UsageSummary,
} from "@/lib/usage-limits";

/**
 * Consumo de recetas de IA (fuente de verdad: backend).
 * Se usa tanto en la pantalla de Chef IA como en el atajo de Inicio, para
 * que el usuario siempre vea cuántas recetas le quedan justo donde las pide.
 */
export function AiUsageNotice({ refreshKey }: { refreshKey: string | number }) {
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  useEffect(() => {
    let alive = true;
    void getUsageSummary()
      .then((u) => {
        if (alive) setUsage(u as UsageSummary);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // Se vuelve a pedir cada vez que cambia refreshKey (p.ej. tras enviar un
    // mensaje o cambiar de plan), para que el contador no se quede desactualizado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (!usage) return null;

  if (usage.remaining > 0) {
    return (
      <p className="rounded-xl bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
        ✨ {usageLabel(usage)}
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-soft">
      <p className="text-sm font-extrabold">
        {usage.isTrial ? TRIAL_LIMIT_REACHED_MESSAGE : LIMIT_REACHED_MESSAGE}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {usage.isTrial ? TRIAL_LIMIT_REACHED_HELP : LIMIT_REACHED_HELP}
      </p>
      <Link
        to="/planes"
        className="mt-3 inline-block rounded-full bg-brand px-5 py-2.5 text-xs font-extrabold text-primary-foreground"
      >
        Ver planes
      </Link>
    </div>
  );
}
