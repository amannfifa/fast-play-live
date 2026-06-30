import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Flag } from "./Flag";
import type { Match } from "@/lib/match-types";

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "2-digit", year: "numeric" });
}

const statusLabel: Record<Match["status"], string> = {
  upcoming: "Upcoming",
  live: "LIVE",
  finished: "Finished",
  replay: "Replay",
};

export function MatchCard({ match }: { match: Match }) {
  const time = fmtTime(match.kickoff_at);
  const [hhmm, ampm] = time.split(" ");
  const date = fmtDate(match.kickoff_at);
  const isLive = match.status === "live";

  return (
    <Link
      to="/match/$id"
      params={{ id: match.id }}
      className="group block px-4 py-5 transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold tabular-nums">{hhmm}</span>
            {ampm && <span className="text-sm font-medium text-foreground/80">{ampm}</span>}
            <span className="text-sm font-medium text-foreground/70">{date}</span>
          </div>
          <div className="space-y-2">
            <TeamRow flag={match.home_flag} name={match.home_team} score={isLive || match.status === "finished" ? match.home_score : null} />
            <TeamRow flag={match.away_flag} name={match.away_team} score={isLive || match.status === "finished" ? match.away_score : null} />
          </div>
        </div>
        <div className="shrink-0 pt-1 text-right">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-destructive">
              <span className="live-dot" /> LIVE
              {match.minute != null && <span className="ml-1 text-destructive/80">{match.minute}'</span>}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-green">
              {statusLabel[match.status]} <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function TeamRow({ flag, name, score }: { flag: string | null; name: string; score: number | null }) {
  return (
    <div className="flex items-center gap-3">
      <Flag code={flag} alt={name} />
      <span className="truncate font-semibold text-foreground">{name}</span>
      {score !== null && (
        <span className="ml-auto font-display text-lg font-bold tabular-nums">{score}</span>
      )}
    </div>
  );
}

export function DateDivider({ label }: { label: string }) {
  return (
    <div className="px-4 pb-2 pt-4 text-sm font-semibold text-sky-400">{label}</div>
  );
}