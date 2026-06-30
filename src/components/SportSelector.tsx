import { Radio } from "lucide-react";
import type { Sport } from "@/lib/match-types";

interface Props {
  sports: Sport[];
  value: string;
  onChange: (key: string) => void;
}

export function SportSelector({ sports, value, onChange }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="card-elevated flex items-center gap-1 overflow-x-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Pill active={value === "live"} onClick={() => onChange("live")}>
          <Radio className="h-4 w-4" />
          <span className="text-sm font-semibold tracking-wide">LIVE NOW</span>
        </Pill>
        {sports.map((s) => (
          <Pill key={s.key} active={value === s.key} onClick={() => onChange(s.key)}>
            <span className="text-base">{s.icon}</span>
            <span className="text-sm font-semibold">{s.name}</span>
          </Pill>
        ))}
      </div>
    </div>
  );
}

function Pill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 transition ${
        active
          ? "bg-secondary text-accent-green ring-1 ring-accent-green/30"
          : "text-foreground/75 hover:bg-secondary/60"
      }`}
    >
      {children}
    </button>
  );
}