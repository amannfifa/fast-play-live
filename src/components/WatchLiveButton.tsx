import { useRef, useState } from "react";
import { PlayCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { MatchRedirect } from "@/lib/match-types";

interface Props {
  matchId: string;
  redirect: MatchRedirect | null;
  live?: boolean;
  /** If true, show the support modal before redirecting. Default: false */
  showSupportModal?: boolean;
}

const LOADING_DELAY_MS = 3000;
const SUPPORT_COUNTDOWN_SECONDS = 20;

/**
 * Redirects the user to the admin-configured destination URL for the match.
 * Tracks click analytics via the increment_redirect_click RPC.
 * Falls back to backup URL if primary fails.
 *
 * A short branded loading screen is shown first so that if the ad network
 * opens a sponsor page before the real destination, the user isn't left
 * wondering whether the site is broken. This is purely a UI layer — the
 * redirect logic, URLs, and ad/redirect system below are unchanged.
 */
export function WatchLiveButton({
  matchId,
  redirect,
  live = false,
  showSupportModal = false,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const pendingRef = useRef(false);
  const countdownCompleteRef = useRef(false);

  const disabled =
    !redirect ||
    !redirect.enabled ||
    (!redirect.primary_url && !redirect.backup_url);

  const performRedirect = () => {
    console.log("[WatchLiveButton] performRedirect() called");
    if (!redirect) {
      console.log("[WatchLiveButton] performRedirect() - no redirect config, returning");
      return;
    }
    const target = redirect.open_in_new_tab ? "_blank" : "_self";
    const url = redirect.primary_url || redirect.backup_url!;
    console.log("[WatchLiveButton] performRedirect() - opening URL:", url, "target:", target);
    try {
      // fire-and-forget analytics; don't block the redirect on it
      supabase.rpc("increment_redirect_click", { _match_id: matchId }).then(() => {
        console.log("[WatchLiveButton] Analytics RPC success");
      });
    } catch (e) {
      console.log("[WatchLiveButton] Analytics RPC failed:", e);
    }
    const win = window.open(url, target, "noopener,noreferrer");
    console.log("[WatchLiveButton] window.open() returned:", win ? "success" : "blocked");
    if (!win && redirect.backup_url && redirect.backup_url !== url) {
      console.log("[WatchLiveButton] Primary failed, trying backup URL:", redirect.backup_url);
      window.open(redirect.backup_url, target, "noopener,noreferrer");
    }
  };

  const handleClick = () => {
    if (disabled || !redirect || busy || pendingRef.current) return;
    pendingRef.current = true;
    setBusy(true);
    performRedirect();
    setBusy(false);
    pendingRef.current = false;
  };

  const handleSupportClick = () => {
    console.log("[WatchLiveButton] handleSupportClick() called");
    // User clicked "Support & Continue" — start the 20-second countdown
    countdownCompleteRef.current = false;

    // Set a timer to redirect after the countdown finishes
    console.log("[WatchLiveButton] Setting redirect timer for", SUPPORT_COUNTDOWN_SECONDS, "seconds");
    window.setTimeout(() => {
      console.log("[WatchLiveButton] Redirect timer fired! Calling performRedirect()");
      performRedirect();
      console.log("[WatchLiveButton] performRedirect() executed");
      countdownCompleteRef.current = true;
      // Modal will fade out after its own internal countdown
    }, SUPPORT_COUNTDOWN_SECONDS * 1000);
  };

  const handleSupportExited = () => {
    console.log("[WatchLiveButton] handleSupportExited() called");
    // Support modal has fully faded out
    setShowSupport(false);
    setBusy(false);
    pendingRef.current = false;
    console.log("[WatchLiveButton] Button state reset");
  };

  const handleOverlayExited = () => {
    setBusy(false);
    pendingRef.current = false;
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
        aria-busy={busy}
        className={[
          "group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-5 text-lg font-bold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-90",
          live
            ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/40 hover:brightness-110"
            : "bg-accent-green text-accent-green-foreground shadow-lg shadow-accent-green/30 hover:brightness-110",
        ].join(" ")}
      >
        {live && !busy && (
          <span className="absolute left-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <span className="live-dot" /> LIVE
          </span>
        )}
        {busy ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
            <span>Opening…</span>
          </>
        ) : (
          <>
            <PlayCircle className="h-6 w-6" />
            <span>{live ? "Watch Live Now" : "Watch Live"}</span>
            <ExternalLink className="h-4 w-4 opacity-80" />
          </>
        )}
      </button>

      </>
  );
}
