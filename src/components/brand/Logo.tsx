import logo from "@/assets/arimundo-logo.png.asset.json";

export function Logo({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logo.url}
      alt="ARIMUNDO MASCOTAS"
      width={size}
      height={size}
      className={`rounded-full object-cover shadow-soft ${className}`}
    />
  );
}
