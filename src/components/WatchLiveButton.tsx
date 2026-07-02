import { useState } from "react";
import { PlayCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { MatchRedirect } from "@/lib/match-types";
import { SupportBeforeLive } from "./SupportBeforeLive";
import { DIRECT_LINK_URL } from "@/lib/ads";

interface Props {
  matchId: string;
  redirect: MatchRedirect | null;
  live?: boolean;
}

/**
 * Redirects the user to the admin-configured destination URL for the match.
 * Tracks click analytics via the increment_redirect_click RPC.
 * Falls back to backup URL if primary fails.
 */
export function WatchLiveButton({ matchId, redirect, live = false }: Props) {
  const [showModal, setShowModal] = useState(false);

  const disabled =
    !redirect ||
    !redirect.enabled ||
    (!redirect.primary_url && !redirect.backup_url);

  const performRedirect = () => {
    if (!redirect) return;
    const target = redirect.open_in_new_tab ? "_blank" : "_self";
    const url = redirect.primary_url || redirect.backup_url!;
    try {
      supabase.rpc("increment_redirect_click", { _match_id: matchId }).then(() => {});
    } catch { /* ignore */ }
    const win = window.open(url, target, "noopener,noreferrer");
    if (!win && redirect.backup_url && redirect.backup_url !== url) {
      window.open(redirect.backup_url, target, "noopener,noreferrer");
    }
  };

  const fireSponsorAd = () => {
    // Open configured sponsor/monetag/propeller direct link in a new tab.
    window.open(DIRECT_LINK_URL, "_blank", "noopener,noreferrer");
  };

  if (disabled) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
        The stream isn't available yet. Please check back at kickoff.
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={[
          "group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-5 text-lg font-bold transition active:scale-[0.99]",
          live
            ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/40 hover:brightness-110"
            : "bg-accent-green text-accent-green-foreground shadow-lg shadow-accent-green/30 hover:brightness-110",
        ].join(" ")}
      >
        {live && (
          <span className="absolute left-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <span className="live-dot" /> LIVE
          </span>
        )}
        <PlayCircle className="h-6 w-6" />
        <span>{live ? "Watch Live Now" : "Watch Live"}</span>
        <ExternalLink className="h-4 w-4 opacity-80" />
      </button>

      <SupportBeforeLive
        open={showModal}
        onClose={() => setShowModal(false)}
        onSupport={fireSponsorAd}
        onContinue={() => {
          performRedirect();
          setShowModal(false);
        }}
      />
    </>
  );
}