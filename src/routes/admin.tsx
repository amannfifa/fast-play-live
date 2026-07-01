import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Plus, Save, Trash2, Radio, Square, RotateCcw, ListVideo, Link2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { matchesQuery, sportsQuery } from "@/lib/queries";
import type { Match, MatchStatus } from "@/lib/match-types";
import { RedirectManager } from "@/components/admin/RedirectManager";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · FootBeats.Live" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<{ userId: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s?.user ? { userId: s.user.id } : null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session?.user ? { userId: data.session.user.id } : null);
    });
    return () => { sub.data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.userId)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [session]);

  if (!session) return <AuthGate />;
  if (isAdmin === null) return <Shell><div className="p-10 text-center text-muted-foreground">Checking access…</div></Shell>;
  if (!isAdmin) return <NotAdmin />;

  return <AdminDashboard />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}

function AuthGate() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const fn = mode === "signin"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
    const { error } = await fn;
    setBusy(false);
    if (error) setErr(error.message);
  };

  return (
    <Shell>
      <div className="card-elevated mx-auto mt-8 max-w-sm p-6">
        <h1 className="font-display text-2xl font-bold">Admin {mode === "signin" ? "sign in" : "sign up"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Restricted area. Admin role required.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input className="w-full rounded-lg border border-border bg-secondary px-3 py-2 outline-none focus:ring-2 focus:ring-accent-green/40" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <input className="w-full rounded-lg border border-border bg-secondary px-3 py-2 outline-none focus:ring-2 focus:ring-accent-green/40" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} />
          {err && <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{err}</div>}
          <button disabled={busy} className="w-full rounded-lg bg-accent-green py-2.5 font-semibold text-accent-green-foreground transition hover:opacity-90 disabled:opacity-50">
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </Shell>
  );
}

function NotAdmin() {
  const userId = useUserId();
  return (
    <Shell>
      <div className="card-elevated mx-auto mt-8 max-w-md p-6 text-center">
        <h1 className="font-display text-xl font-bold">Not an admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account doesn't have the admin role yet. Grant it by running this once in the Cloud SQL editor:
        </p>
        <pre className="mt-3 overflow-auto rounded-lg bg-secondary p-3 text-left text-xs">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${userId ?? "<your-user-id>"}', 'admin');`}
        </pre>
        <button onClick={() => supabase.auth.signOut()} className="mt-4 inline-flex items-center gap-1 text-sm text-accent-green">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </Shell>
  );
}

function useUserId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setId(data.user?.id ?? null)); }, []);
  return id;
}

function AdminDashboard() {
  const qc = useQueryClient();
  const { data: sports = [] } = useQuery(sportsQuery());
  const [filter, setFilter] = useState<string>("");
  const sportKey = filter || sports[0]?.key || "fifa-wc";
  const { data: matches = [] } = useQuery({ ...matchesQuery(sportKey), enabled: !!sportKey });
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"matches" | "redirects">("matches");

  const refresh = () => qc.invalidateQueries({ queryKey: ["matches"] });

  return (
    <Shell>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Admin dashboard</h1>
        <button onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs hover:bg-secondary/70">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1 rounded-full bg-secondary p-1 text-sm">
        <TabPill active={tab === "matches"} onClick={() => setTab("matches")} icon={<ListVideo className="h-3.5 w-3.5" />} label="Matches" />
        <TabPill active={tab === "redirects"} onClick={() => setTab("redirects")} icon={<Link2 className="h-3.5 w-3.5" />} label="Redirect Manager" />
      </div>

      {tab === "redirects" ? (
        <RedirectManager />
      ) : (
        <MatchesTab
          sports={sports}
          sportKey={sportKey}
          setFilter={setFilter}
          matches={matches}
          creating={creating}
          setCreating={setCreating}
          refresh={refresh}
        />
      )}
    </Shell>
  );
}

function TabPill({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition ${active ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
    >
      {icon} {label}
    </button>
  );
}

function MatchesTab({ sports, sportKey, setFilter, matches, creating, setCreating, refresh }: {
  sports: { key: string; name: string }[];
  sportKey: string;
  setFilter: (v: string) => void;
  matches: Match[];
  creating: boolean;
  setCreating: (v: boolean) => void;
  refresh: () => void;
}) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={sportKey} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm">
          {sports.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
        </select>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-accent-green px-3 py-2 text-sm font-semibold text-accent-green-foreground">
          <Plus className="h-4 w-4" /> New match
        </button>
      </div>

      {creating && (
        <MatchEditor
          sportKey={sportKey}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); refresh(); }}
        />
      )}

      <div className="space-y-3">
        {matches.map((m) => <AdminMatchRow key={m.id} match={m} onChange={refresh} />)}
        {matches.length === 0 && <div className="text-center text-sm text-muted-foreground">No matches.</div>}
      </div>
    </>
  );
}

function AdminMatchRow({ match, onChange }: { match: Match; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const setStatus = async (status: MatchStatus) => {
    await supabase.from("matches").update({ status }).eq("id", match.id);
    onChange();
  };
  const remove = async () => {
    if (!confirm("Delete this match?")) return;
    await supabase.from("matches").delete().eq("id", match.id);
    onChange();
  };
  return (
    <div className="card-elevated p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{match.competition}</div>
          <div className="font-display font-bold">{match.home_team} vs {match.away_team}</div>
          <div className="text-xs text-muted-foreground">{new Date(match.kickoff_at).toLocaleString()}</div>
          <div className="mt-1 text-xs font-semibold text-accent-green">Status: {match.status}</div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <IconBtn title="Go LIVE" onClick={() => setStatus("live")}><Radio className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title="Stop / finish" onClick={() => setStatus("finished")}><Square className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title="Move to replay" onClick={() => setStatus("replay")}><RotateCcw className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title="Edit" onClick={() => setEditing((v) => !v)}><Save className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn title="Delete" onClick={remove}><Trash2 className="h-3.5 w-3.5 text-destructive" /></IconBtn>
        </div>
      </div>
      {editing && (
        <div className="mt-4 border-t border-border pt-4">
          <MatchEditor sportKey={match.sport_key} match={match} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); onChange(); }} />
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className="rounded-md bg-secondary p-2 hover:bg-secondary/70">{children}</button>;
}

function MatchEditor({ match, sportKey, onClose, onSaved }: { match?: Match; sportKey: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    competition: match?.competition ?? "Round of 32",
    home_team: match?.home_team ?? "",
    away_team: match?.away_team ?? "",
    home_flag: match?.home_flag ?? "",
    away_flag: match?.away_flag ?? "",
    kickoff_at: match ? new Date(match.kickoff_at).toISOString().slice(0, 16) : "",
    venue: match?.venue ?? "",
    city: match?.city ?? "",
    referee: match?.referee ?? "",
    home_score: match?.home_score ?? 0,
    away_score: match?.away_score ?? 0,
    minute: match?.minute ?? 0,
    possession_home: match?.possession_home ?? 50,
    shots_home: match?.shots_home ?? 0,
    shots_away: match?.shots_away ?? 0,
    corners_home: match?.corners_home ?? 0,
    corners_away: match?.corners_away ?? 0,
    stream_url: match?.stream_url ?? "",
    replay_url: match?.replay_url ?? "",
    status: match?.status ?? "upcoming" as MatchStatus,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true); setErr(null);
    const payload = { ...form, sport_key: sportKey, kickoff_at: new Date(form.kickoff_at).toISOString() };
    const { error } = match
      ? await supabase.from("matches").update(payload).eq("id", match.id)
      : await supabase.from("matches").insert(payload);
    setBusy(false);
    if (error) setErr(error.message); else onSaved();
  };

  return (
    <div className="card-elevated space-y-3 bg-secondary/30 p-4">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Competition"><Input value={form.competition} onChange={(v) => set("competition", v)} /></Field>
        <Field label="Status">
          <select className="w-full rounded-md border border-border bg-secondary px-2 py-1.5 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="upcoming">upcoming</option>
            <option value="live">live</option>
            <option value="finished">finished</option>
            <option value="replay">replay</option>
          </select>
        </Field>
        <Field label="Home team"><Input value={form.home_team} onChange={(v) => set("home_team", v)} /></Field>
        <Field label="Away team"><Input value={form.away_team} onChange={(v) => set("away_team", v)} /></Field>
        <Field label="Home flag (ISO-2)"><Input value={form.home_flag} onChange={(v) => set("home_flag", v.toLowerCase())} placeholder="fr" /></Field>
        <Field label="Away flag (ISO-2)"><Input value={form.away_flag} onChange={(v) => set("away_flag", v.toLowerCase())} placeholder="se" /></Field>
        <Field label="Kickoff (local)"><Input type="datetime-local" value={form.kickoff_at} onChange={(v) => set("kickoff_at", v)} /></Field>
        <Field label="Venue"><Input value={form.venue} onChange={(v) => set("venue", v)} /></Field>
        <Field label="City"><Input value={form.city} onChange={(v) => set("city", v)} /></Field>
        <Field label="Referee"><Input value={form.referee} onChange={(v) => set("referee", v)} /></Field>
        <Field label="Home score"><Input type="number" value={String(form.home_score)} onChange={(v) => set("home_score", Number(v))} /></Field>
        <Field label="Away score"><Input type="number" value={String(form.away_score)} onChange={(v) => set("away_score", Number(v))} /></Field>
        <Field label="Minute"><Input type="number" value={String(form.minute)} onChange={(v) => set("minute", Number(v))} /></Field>
        <Field label="Possession (home %)"><Input type="number" value={String(form.possession_home)} onChange={(v) => set("possession_home", Number(v))} /></Field>
        <Field label="Shots H/A"><div className="flex gap-1"><Input type="number" value={String(form.shots_home)} onChange={(v) => set("shots_home", Number(v))} /><Input type="number" value={String(form.shots_away)} onChange={(v) => set("shots_away", Number(v))} /></div></Field>
        <Field label="Corners H/A"><div className="flex gap-1"><Input type="number" value={String(form.corners_home)} onChange={(v) => set("corners_home", Number(v))} /><Input type="number" value={String(form.corners_away)} onChange={(v) => set("corners_away", Number(v))} /></div></Field>
      </div>
      <Field label="Live stream URL (HLS .m3u8 or MP4)"><Input value={form.stream_url} onChange={(v) => set("stream_url", v)} placeholder="https://…/index.m3u8" /></Field>
      <Field label="Replay video URL"><Input value={form.replay_url} onChange={(v) => set("replay_url", v)} placeholder="https://…/replay.mp4" /></Field>
      {err && <div className="rounded-md bg-destructive/15 p-2 text-xs text-destructive">{err}</div>}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onClose} className="rounded-lg bg-secondary px-3 py-2 text-sm">Cancel</button>
        <button onClick={save} disabled={busy} className="rounded-lg bg-accent-green px-3 py-2 text-sm font-semibold text-accent-green-foreground">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function Input(p: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <input type={p.type ?? "text"} value={p.value} onChange={(e) => p.onChange(e.target.value)} placeholder={p.placeholder} className="w-full rounded-md border border-border bg-secondary px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent-green/40" />;
}