import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Tv, Video } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SportSelector } from "@/components/SportSelector";
import { MatchCard, DateDivider } from "@/components/MatchCard";
import { sportsQuery, matchesQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FootBeats.Live — Watch Live Football & Sports Free" },
      { name: "description", content: "Watch the FIFA World Cup, Premier League, MLB, NBA and more live in HD. Fast, free, mobile-first sports streaming." },
      { property: "og:title", content: "FootBeats.Live — Watch Live Football & Sports" },
      { property: "og:description", content: "Watch the FIFA World Cup, Premier League, MLB, NBA and more live in HD." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(sportsQuery());
  },
  component: Index,
});

function Index() {
  const { data: sports } = useSuspenseQuery(sportsQuery());
  const defaultSport = sports[0]?.key ?? "live";
  const [sport, setSport] = useState<string>(defaultSport);
  const [tab, setTab] = useState<"live" | "replay">("live");

  return (
    <div className="min-h-screen pb-16">
      <Navbar />
      <main className="mx-auto max-w-3xl">
        <h1 className="sr-only">Live sports streaming on FootBeats.Live</h1>

        <div className="px-4 pt-4">
          <AdBannerResponsive />
        </div>

        <div className="pt-4">
          <SportSelector sports={sports} value={sport} onChange={setSport} />
        </div>

        <section className="mx-auto mt-5 max-w-3xl px-4">
          <div className="card-elevated overflow-hidden">
            <div className="grid grid-cols-2 border-b border-border">
              <TabButton active={tab === "live"} onClick={() => setTab("live")} icon={<Tv className="h-4 w-4" />} label="Live" />
              <TabButton active={tab === "replay"} onClick={() => setTab("replay")} icon={<Video className="h-4 w-4" />} label="Replay" />
            </div>
            <MatchList sport={sport} tab={tab} />
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-3xl px-4">
          <NativeBanner />
        </section>

        <footer className="mx-auto mt-8 max-w-3xl px-4 pb-6 text-center text-xs text-muted-foreground">
          <a
            href={DIRECT_LINK_URL}
            target="_blank"
            rel="noopener sponsored"
            className="hover:text-accent-green"
          >
            Sponsored partner
          </a>
          <span className="mx-2 opacity-40">·</span>
          <span>© {new Date().getFullYear()} FootBeats.Live</span>
        </footer>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-4 text-sm font-semibold transition ${
        active ? "bg-secondary/60 text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function MatchList({ sport, tab }: { sport: string; tab: "live" | "replay" }) {
  const { data: matches } = useSuspenseQuery(matchesQuery(sport));
  const filtered = matches.filter((m) =>
    tab === "replay" ? m.status === "replay" || m.status === "finished" : m.status !== "replay",
  );

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No {tab === "replay" ? "replays" : "matches"} yet.
      </div>
    );
  }

  // Group by day
  const groups = new Map<string, typeof filtered>();
  for (const m of filtered) {
    const d = new Date(m.kickoff_at);
    const key = d.toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }
  const today = new Date().toDateString();
  const tomorrow = new Date(Date.now() + 86400000).toDateString();
  const labelFor = (key: string) => {
    if (key === today) return null;
    if (key === tomorrow) return "Tomorrow, " + new Date(key).toLocaleDateString("en-GB", { month: "long", day: "numeric" });
    return new Date(key).toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric" });
  };

  return (
    <div className="divide-y divide-border">
      {[...groups.entries()].map(([key, list]) => (
        <div key={key}>
          {labelFor(key) && <DateDivider label={labelFor(key)!} />}
          {list.map((m) => (
            <div key={m.id} className="border-t border-border first:border-t-0">
              <MatchCard match={m} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
