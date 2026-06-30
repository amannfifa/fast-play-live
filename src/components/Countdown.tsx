import { useEffect, useState } from "react";

export function Countdown({ to, onElapsed }: { to: string; onElapsed?: () => void }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  useEffect(() => {
    if (diff === 0) onElapsed?.();
  }, [diff, onElapsed]);

  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const Cell = ({ value, label }: { value: number; label: string }) => (
    <div className="card-elevated flex w-20 flex-col items-center justify-center py-3">
      <div className="font-display text-3xl font-extrabold tabular-nums text-accent-green">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-2">
      <Cell value={days} label="Days" />
      <Cell value={hours} label="Hrs" />
      <Cell value={mins} label="Min" />
      <Cell value={secs} label="Sec" />
    </div>
  );
}