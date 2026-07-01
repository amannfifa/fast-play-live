import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Pencil, Link as LinkIcon, Activity, Clock, MousePointerClick } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { allRedirectsQuery, matchesQuery, sportsQuery } from "@/lib/queries";
import type { Match, MatchRedirect } from "@/lib/match-types";

const urlSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https:\/\/.+/i.test(v), {
    message: "URL must start with https://",
  });

export function RedirectManager() {
  const qc = useQueryClient();
  const { data: sports = [] } = useQuery(sportsQuery());
  const sportKey = sports[0]?.key ?? "fifa-wc";
  const { data: matches = [] } = useQuery({ ...matchesQuery(sportKey), enabled: !!sportKey });
  const { data: redirects = [] } = useQuery(allRedirectsQuery());
  const [editing, setEditing] = useState<Match | null>(null);

  const redirectByMatch = useMemo(() => {
    const map = new Map<string, MatchRedirect>();
    for (const r of redirects) map.set(r.match_id, r);
    return map;
  }, [redirects]);

  const totals = useMemo(() => {
    let total = 0;
    let today = 0;
    let last: string | null = null;
    for (const r of redirects) {
      total += r.click_count;
      today += r.clicks_today;
      if (r.last_clicked_at && (!last || r.last_clicked_at > last)) last = r.last_clicked_at;
    }
    return { total, today, last };
  }, [redirects]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["match-redirects"] });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={<MousePointerClick className="h-4 w-4" />} label="Total redirect clicks" value={totals.total.toLocaleString()} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Clicks today" value={totals.today.toLocaleString()} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Last redirect" value={totals.last ? new Date(totals.last).toLocaleString() : "—"} />
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="font-display text-lg font-bold">Redirect Manager</h2>
          <p className="text-xs text-muted-foreground">
            Change where the “Watch Live” button sends users — updates go live instantly.
          </p>
        </div>
        <div className="divide-y divide-border">
          {matches.map((m) => {
            const r = redirectByMatch.get(m.id);
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">
                    {m.id.slice(0, 8)} · {new Date(m.kickoff_at).toLocaleString()}
                  </div>
                  <div className="font-display font-bold">
                    {m.home_team} <span className="text-muted-foreground">vs</span> {m.away_team}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <LinkIcon className="h-3 w-3" />
                    <span className="truncate">
                      {r?.primary_url || <span className="italic">not set</span>}
                    </span>
                  </div>
                </div>
                <StatusPill r={r} />
                <button
                  onClick={() => setEditing(m)}
                  className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/70"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
            );
          })}
          {matches.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">No matches yet.</div>
          )}
        </div>
      </div>

      {editing && (
        <EditRedirectDialog
          match={editing}
          current={redirectByMatch.get(editing.id) ?? null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
    </div>
  );
}

function StatusPill({ r }: { r: MatchRedirect | undefined }) {
  if (!r || !r.primary_url) {
    return <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Not set</span>;
  }
  return r.enabled ? (
    <span className="rounded-full bg-accent-green/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-green">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-destructive">
      Disabled
    </span>
  );
}

function EditRedirectDialog({
  match,
  current,
  onClose,
  onSaved,
}: {
  match: Match;
  current: MatchRedirect | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [primary, setPrimary] = useState(current?.primary_url ?? "");
  const [backup, setBackup] = useState(current?.backup_url ?? "");
  const [openNewTab, setOpenNewTab] = useState(current?.open_in_new_tab ?? true);
  const [enabled, setEnabled] = useState(current?.enabled ?? true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr(null);
    const p = urlSchema.safeParse(primary);
    const b = urlSchema.safeParse(backup);
    if (!p.success) return setErr("Primary URL: " + p.error.issues[0].message);
    if (!b.success) return setErr("Backup URL: " + b.error.issues[0].message);
    if (!primary.trim() && !backup.trim()) return setErr("Enter at least one URL.");

    setBusy(true);
    const payload = {
      match_id: match.id,
      primary_url: primary.trim() || null,
      backup_url: backup.trim() || null,
      open_in_new_tab: openNewTab,
      enabled,
    };
    const { error } = await supabase
      .from("match_redirects")
      .upsert(payload, { onConflict: "match_id" });
    setBusy(false);
    if (error) return setErr(error.message);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="card-elevated w-full max-w-lg space-y-4 p-6">
        <div>
          <h3 className="font-display text-lg font-bold">Edit redirect</h3>
          <p className="text-xs text-muted-foreground">
            {match.home_team} vs {match.away_team}
          </p>
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Primary URL</span>
          <input
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            placeholder="https://friendsite.com/live"
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-green/40"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Backup URL (optional)</span>
          <input
            value={backup}
            onChange={(e) => setBackup(e.target.value)}
            placeholder="https://backup.example.com/live"
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-green/40"
          />
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <Toggle checked={openNewTab} onChange={setOpenNewTab} label="Open in new tab" />
          <Toggle checked={enabled} onChange={setEnabled} label="Redirect enabled" />
        </div>
        {err && <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{err}</div>}
        {current && (
          <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center text-xs text-muted-foreground">
            <div><div className="font-bold text-foreground">{current.click_count}</div>total clicks</div>
            <div><div className="font-bold text-foreground">{current.clicks_today}</div>today</div>
            <div><div className="font-bold text-foreground">{current.last_clicked_at ? new Date(current.last_clicked_at).toLocaleTimeString() : "—"}</div>last click</div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-secondary px-3 py-2 text-sm">Cancel</button>
          <button
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-accent-green px-4 py-2 text-sm font-semibold text-accent-green-foreground disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-accent-green" : "bg-secondary"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition ${checked ? "left-4" : "left-0.5"}`}
        />
      </button>
      {label}
    </label>
  );
}