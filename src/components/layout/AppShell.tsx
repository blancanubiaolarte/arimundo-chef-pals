import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, ShoppingCart, Dog as DogIcon, User } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { useApp } from "@/lib/app-store";

const NAV = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/recetas", label: "Recetas", icon: BookOpen },
  { to: "/compras", label: "Compras", icon: ShoppingCart },
  { to: "/perros", label: "Mis Perros", icon: DogIcon },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function TrialBadge() {
  const { user, trialDaysLeft, isTrialActive } = useApp();
  if (!user) return null;
  if (!isTrialActive) return null;
  return (
    <Link
      to="/planes"
      className="rounded-full bg-wood px-3 py-1.5 text-xs font-semibold text-wood-foreground"
    >
      Prueba · {trialDaysLeft} {trialDaysLeft === 1 ? "día" : "días"}
    </Link>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
  hideNav = false,
}: {
  title?: string | undefined;
  subtitle?: string | undefined;
  children: ReactNode;
  hideNav?: boolean | undefined;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur">
        <Logo size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold leading-tight">
            {title ?? "ARIMUNDO MASCOTAS"}
          </p>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <TrialBadge />
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      {!hideNav ? (
        <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-card/95 backdrop-blur">
          <ul className="flex items-stretch justify-between px-2 py-2">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <li key={to} className="flex-1">
                  <Link
                    to={to}
                    className={`flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
