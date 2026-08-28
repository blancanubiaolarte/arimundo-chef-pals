import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useApp } from "@/lib/app-store";
import { Logo } from "@/components/brand/Logo";

/**
 * Protege las pantallas de la aplicación.
 * La navegación siempre es libre: cuando la prueba vence y no hay plan
 * activo, el contenido queda bloqueado detrás de un aviso de suscripción
 * en lugar de redirigir al usuario a /planes.
 */
export function AuthGate({
  children,
  requireDog = true,
}: {
  children: ReactNode;
  requireDog?: boolean;
}) {
  const { hydrated, user, dogs, hasAccess } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (requireDog && dogs.length === 0 && pathname !== "/onboarding/perro") {
      navigate({ to: "/onboarding/perro", replace: true });
    }
  }, [hydrated, user, dogs.length, requireDog, pathname, navigate]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Logo size={72} className="animate-pulse" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="relative">
        <div aria-hidden className="pointer-events-none select-none opacity-30 blur-[2px]">
          {children}
        </div>
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-center shadow-xl">
            <Logo size={56} className="mx-auto" />
            <h2 className="mt-4 font-display text-lg font-bold">
              Tu prueba gratuita terminó
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Elige un plan para seguir disfrutando de recetas personalizadas,
              Chef IA y todas las funciones Premium de ARIMUNDO Chef.
            </p>
            <Link
              to="/planes"
              className="mt-5 block rounded-full bg-wood px-5 py-3 text-sm font-bold text-wood-foreground transition-transform active:scale-95"
            >
              Ver planes
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              Cancela cuando quieras · Sin compromisos
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
