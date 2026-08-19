import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useApp } from "@/lib/app-store";
import { Logo } from "@/components/brand/Logo";

/**
 * Protege las pantallas de la aplicación.
 * Cuando se conecte Supabase, la sesión vendrá del cliente de autenticación
 * y esta lógica pasará al layout `_authenticated`.
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
      return;
    }
    if (!hasAccess && pathname !== "/planes") {
      navigate({ to: "/planes", replace: true });
    }
  }, [hydrated, user, dogs.length, hasAccess, requireDog, pathname, navigate]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Logo size={72} className="animate-pulse" />
      </div>
    );
  }

  return <>{children}</>;
}
