import logoUrl from "@/assets/arimundo-logo.png";

export function Logo({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logoUrl}
      alt="ARIMUNDO MASCOTAS"
      width={size}
      height={size}
      className={`rounded-full object-cover shadow-soft ${className}`}
    />
  );
}
