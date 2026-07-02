import { useRef, useState } from "react";
import { PlayCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { MatchRedirect } from "@/lib/match-types";
import { SupportBeforeLive } from "@/components/SupportBeforeLive";
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
  const [busy, setBusy] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  // Pre-opened window for the stream so popup blockers don't kill the
  // async open() call fired after the countdown resolves.
  const streamWinRef = useRef<Window | null>(null);

  const disabled =
    !redirect ||
    !redirect.enabled ||
    (!redirect.primary_url && !redirect.backup_url);

  const openStream = () => {
    if (!redirect) return;
    const url = redirect.primary_url || redirect.backup_url!;
    // Fire-and-forget analytics.
    try {
      supabase.rpc("increment_redirect_click", { _match_id: matchId }).then(() => {});
    } catch {
      /* ignore */
    }
    if (redirect.open_in_new_tab) {
      // Use the pre-opened blank window if available (survives popup blockers
      // because it was created inside the user-gesture click).
      const pre = streamWinRef.current;
      if (pre && !pre.closed) {
        try {
          pre.opener = null;
          pre.location.replace(url);
        } catch {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      } else {
        const win = window.open(url, "_blank", "noopener,noreferrer");
        if (!win && redirect.backup_url && redirect.backup_url !== url) {
          window.open(redirect.backup_url, "_blank", "noopener,noreferrer");
        }
      }
    } else {
      window.location.href = url;
    }
    streamWinRef.current = null;
  };

  const handleClick = () => {
    if (disabled || !redirect) return;
    // Pre-open a blank tab now (inside the user gesture) so we can navigate
    // it to the stream after the async countdown without being blocked.
    if (redirect.open_in_new_tab) {
      try {
        streamWinRef.current = window.open("about:blank", "_blank");
      } catch {
        streamWinRef.current = null;
      }
    }
    setShowSupport(true);
  };

  const handleSupport = () => {
    // Fire the sponsor ad in a new tab — DO NOT change this logic.
    try {
      window.open(DIRECT_LINK_URL, "_blank", "noopener,noreferrer");
    } catch {
      /* ignore */
    }
  };

  const handleContinue = () => {
    setShowSupport(false);
    setBusy(true);
    openStream();
    setBusy(false);
  };

  const handleClose = () => {
    setShowSupport(false);
    // Close the pre-opened blank tab if the user cancels.
    try {
      streamWinRef.current?.close();
    } catch {
      /* ignore */
    }
    streamWinRef.current = null;
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
        onClick={handleClick}
        disabled={busy}
        aria-label={live ? "Watch live stream now" : "Watch live stream"}
        className={[
          "group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-5 text-lg font-bold transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          live
            ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/40 hover:brightness-110"
            : "bg-accent-green text-accent-green-foreground shadow-lg shadow-accent-green/30 hover:brightness-110",
        ].join(" ")}
      >
        {live && (
          <span className="absolute left-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <span className="live-dot" aria-hidden="true" /> LIVE
          </span>
        )}
        <PlayCircle className="h-6 w-6" aria-hidden="true" />
        <span>{live ? "Watch Live Now" : "Watch Live"}</span>
        <ExternalLink className="h-4 w-4 opacity-80" aria-hidden="true" />
      </button>

      <SupportBeforeLive
        open={showSupport}
        onSupport={handleSupport}
        onContinue={handleContinue}
        onClose={handleClose}
      />
    </>
  );
}