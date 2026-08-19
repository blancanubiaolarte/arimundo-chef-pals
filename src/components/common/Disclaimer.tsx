import { Info } from "lucide-react";
import { DIETARY_DISCLAIMER } from "@/lib/mock-data";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex gap-2 rounded-xl bg-muted p-3 text-[11px] leading-relaxed text-muted-foreground ${className}`}
    >
      <Info className="mt-0.5 size-4 shrink-0" />
      <span>{DIETARY_DISCLAIMER}</span>
    </p>
  );
}
