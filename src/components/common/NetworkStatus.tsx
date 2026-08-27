import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Aviso accesible cuando el dispositivo pierde la conexión a internet. */
export function NetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 mx-auto flex w-full max-w-md items-center justify-center gap-2 bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground"
    >
      <WifiOff aria-hidden="true" className="size-4" />
      Sin conexión a internet. Algunas funciones no estarán disponibles.
    </div>
  );
}
