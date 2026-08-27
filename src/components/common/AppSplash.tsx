import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";

/**
 * Pantalla de carga (splash) que se muestra durante el arranque de la app,
 * requisito habitual para empaquetados TWA (Play Store) y WebView (App Store).
 */
export function AppSplash() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setHidden(true), 650);
    return () => window.clearTimeout(timeout);
  }, []);

  if (hidden) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-background transition-opacity duration-500"
      style={{ opacity: hidden ? 0 : 1 }}
    >
      <Logo size={112} />
      <p className="font-display text-base font-extrabold tracking-wide">ARIMUNDO MASCOTAS</p>
      <span className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}
