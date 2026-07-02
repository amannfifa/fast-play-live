import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, Share2, Eye, MapPin, ShieldAlert } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Flag } from "@/components/Flag";
import { Countdown } from "@/components/Countdown";
import { WatchLiveButton } from "@/components/WatchLiveButton";
import { matchQuery, matchRedirectQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/match/$id")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(matchQuery(params.id));
  },
  component: MatchPage,
});

function MatchPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: match } = useSuspenseQuery(matchQuery(id));
  const { data: redirect } = useQuery(matchRedirectQuery(id));

  // Realtime sync (match + redirect)
  useEffect(() => {
    const ch = supabase
      .channel(`match-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["match", id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "match_redirects", filter: `match_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["match-redirect", id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  if (!match) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
          Match not found. <Link to="/" className="text-accent-green underline">Go home</Link>
        </div>
      </div>
    );
  }

  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `${match.home_team} vs ${match.away_team}`, url }); } catch { /* cancel */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => router.history.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/70">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>

        {isUpcoming ? (
          <OfflinePlayer kickoff={match.kickoff_at} />
        ) : (
          <div className="rounded-2xl bg-gradient-to-br from-card to-secondary p-6 ring-1 ring-border">
            <WatchLiveButton matchId={id} redirect={redirect ?? null} live={isLive} />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Clicking will open the live stream in {redirect?.open_in_new_tab === false ? "the same" : "a new"} tab.
            </p>
          </div>
        )}
        
        <header className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-accent-green">
            {match.competition ?? "Match"}
          </div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <Team flag={match.home_flag} name={match.home_team} />
            <div className="text-center">
              {match.status === "upcoming" ? (
                <div className="font-display text-2xl font-bold text-muted-foreground">VS</div>
              ) : (
                <div className="font-display text-4xl font-extrabold tabular-nums">
                  {match.home_score} <span className="text-muted-foreground">–</span> {match.away_score}
                </div>
              )}
              {match.status === "live" && (
                <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-destructive">
                  <span className="live-dot" /> LIVE {match.minute != null && `${match.minute}'`}
                </div>
              )}
            </div>
            <Team flag={match.away_flag} name={match.away_team} reverse />
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {match.viewer_count != null && match.status === "live" && (
            <Stat icon={<Eye className="h-4 w-4" />} label="Viewers" value={match.viewer_count.toLocaleString()} />
          )}
          {match.venue && <Stat icon={<MapPin className="h-4 w-4" />} label="Venue" value={match.venue} />}
          {match.referee && <Stat icon={<ShieldAlert className="h-4 w-4" />} label="Referee" value={match.referee} />}
          {match.city && <Stat icon={<MapPin className="h-4 w-4" />} label="City" value={match.city} />}
        </section>

        {(match.possession_home != null || (match.shots_home ?? 0) + (match.shots_away ?? 0) > 0) && (
          <section className="card-elevated mt-6 p-5">
            <h2 className="mb-4 font-display text-lg font-bold">Match stats</h2>
            <StatBar label="Possession %" home={match.possession_home ?? 50} away={100 - (match.possession_home ?? 50)} />
            <StatBar label="Shots" home={match.shots_home ?? 0} away={match.shots_away ?? 0} />
            <StatBar label="Corners" home={match.corners_home ?? 0} away={match.corners_away ?? 0} />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
              <Card label="Yellow" home={match.yellow_home ?? 0} away={match.yellow_away ?? 0} color="bg-amber-400" />
              <Card label="Red" home={match.red_home ?? 0} away={match.red_away ?? 0} color="bg-red-500" />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function OfflinePlayer({ kickoff }: { kickoff: string }) {
  const qc = useQueryClient();
  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-card to-secondary p-6 ring-1 ring-border">
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div className="text-sm font-semibold uppercase tracking-widest text-accent-green">Stream starting soon</div>
        <Countdown to={kickoff} onElapsed={() => qc.invalidateQueries()} />
        <p className="max-w-xs text-xs text-muted-foreground">The live stream will become available automatically at kickoff.</p>
      </div>
    </div>
  );
}

function Team({ flag, name, reverse = false }: { flag: string | null; name: string; reverse?: boolean }) {
  return (
    <div className={`flex flex-1 items-center gap-3 ${reverse ? "flex-row-reverse text-right" : ""}`}>
      <div className="shrink-0"><Flag code={flag} alt={name} /></div>
      <div className="min-w-0 font-display text-lg font-bold leading-tight">{name}</div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-elevated p-3">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">{icon} {label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function StatBar({ label, home, away }: { label: string; home: number; away: number }) {
  const total = Math.max(home + away, 1);
  const hp = (home / total) * 100;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-xs font-semibold">
        <span className="text-foreground">{home}</span>
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{away}</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
        <div className="bg-accent-green" style={{ width: `${hp}%` }} />
        <div className="bg-sky-400" style={{ width: `${100 - hp}%` }} />
      </div>
    </div>
  );
}

function Card({ label, home, away, color }: { label: string; home: number; away: number; color: string }) {
  return (
    <div className="card-elevated flex items-center justify-between p-3">
      <span className="font-display text-xl font-bold tabular-nums">{home}</span>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className={`h-3 w-2 rounded-sm ${color}`} /> {label}
      </div>
      <span className="font-display text-xl font-bold tabular-nums">{away}</span>
    </div>
  );
}
