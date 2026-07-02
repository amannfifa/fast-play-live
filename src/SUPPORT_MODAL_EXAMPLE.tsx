/**
 * USAGE EXAMPLES - Support Before Live Modal
 *
 * Copy-paste these examples into your match pages to enable the support modal.
 */

import { WatchLiveButton } from "@/components/WatchLiveButton";
import type { MatchRedirect } from "@/lib/match-types";

// ============================================================================
// EXAMPLE 1: Enable support modal for all "Watch Live" buttons
// ============================================================================

export function MatchPageWithSupportModal() {
  const matchId = "match-2025-07-01-001";
  const redirect: MatchRedirect = {
    id: "redirect-1",
    match_id: matchId,
    primary_url: "https://stream.example.com/live/match1",
    backup_url: "https://backup.example.com/live/match1",
    open_in_new_tab: true,
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <h1>Manchester United vs Liverpool</h1>

      {/* Enable support modal: user sees support page before redirect */}
      <WatchLiveButton
        matchId={matchId}
        redirect={redirect}
        live={true}
        showSupportModal={true}  // ← Enable the support modal
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Conditional support modal based on admin config
// ============================================================================

export function MatchPageConditionalSupport({
  includeSupport = true,
}: {
  includeSupport?: boolean;
}) {
  const matchId = "match-2025-07-01-002";
  const redirect: MatchRedirect = {
    id: "redirect-2",
    match_id: matchId,
    primary_url: "https://stream.example.com/live/match2",
    backup_url: "https://backup.example.com/live/match2",
    open_in_new_tab: true,
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <WatchLiveButton
      matchId={matchId}
      redirect={redirect}
      live={true}
      showSupportModal={includeSupport}  // ← Dynamically enable/disable
    />
  );
}

// ============================================================================
// EXAMPLE 3: Different buttons with different settings
// ============================================================================

export function MatchCardsGrid() {
  const matches = [
    {
      id: "match-1",
      title: "Manchester United vs Liverpool",
      showSupport: true,  // Show support modal
      redirect: {
        id: "r1",
        match_id: "match-1",
        primary_url: "https://stream.example.com/1",
        backup_url: "https://backup.example.com/1",
        open_in_new_tab: true,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as MatchRedirect,
    },
    {
      id: "match-2",
      title: "Arsenal vs Chelsea",
      showSupport: false,  // Skip support modal, use original loader
      redirect: {
        id: "r2",
        match_id: "match-2",
        primary_url: "https://stream.example.com/2",
        backup_url: "https://backup.example.com/2",
        open_in_new_tab: true,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as MatchRedirect,
    },
  ];

  return (
    <div className="grid gap-6">
      {matches.map((match) => (
        <div key={match.id} className="card-elevated p-6">
          <h3>{match.title}</h3>
          <WatchLiveButton
            matchId={match.id}
            redirect={match.redirect}
            live={true}
            showSupportModal={match.showSupport}  // ← Per-match control
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Admin toggle for support modal
// ============================================================================

import { useState } from "react";

export function MatchPageWithAdminToggle() {
  const [showSupportModal, setShowSupportModal] = useState(true);

  const matchId = "match-2025-07-01-003";
  const redirect: MatchRedirect = {
    id: "redirect-3",
    match_id: matchId,
    primary_url: "https://stream.example.com/live/match3",
    backup_url: "https://backup.example.com/live/match3",
    open_in_new_tab: true,
    enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="support-toggle"
          checked={showSupportModal}
          onChange={(e) => setShowSupportModal(e.target.checked)}
        />
        <label htmlFor="support-toggle">Show support modal before stream</label>
      </div>

      <WatchLiveButton
        matchId={matchId}
        redirect={redirect}
        live={true}
        showSupportModal={showSupportModal}  // ← Toggle on/off for testing
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Fallback to original loader if no support modal
// ============================================================================

export function MatchPageWithFallback() {
  const matchId = "match-2025-07-01-004";
  const redirect: MatchRedirect | null = null;  // Simulate no redirect

  // If redirect is unavailable, button shows "not available yet" message
  // If redirect exists and showSupportModal=true, shows support modal
  // If redirect exists and showSupportModal=false/undefined, shows original 3s loader

  return (
    <WatchLiveButton
      matchId={matchId}
      redirect={redirect}
      live={true}
      showSupportModal={true}  // Ignored if redirect is null, button disables gracefully
    />
  );
}

// ============================================================================
// EXAMPLE 6: Different countdown durations (for testing)
// ============================================================================

/**
 * To change the countdown duration, you'll need to modify the constants
 * in WatchLiveButton.tsx and SupportBeforeLiveModal.tsx:
 *
 * In WatchLiveButton.tsx:
 * ```
 * const SUPPORT_COUNTDOWN_SECONDS = 10;  // Change from 20 to 10
 * ```
 *
 * Then pass it to the modal:
 * ```
 * <SupportBeforeLiveModal
 *   countdownSeconds={SUPPORT_COUNTDOWN_SECONDS}
 * />
 * ```
 *
 * For now, the default is locked at 20 seconds. You can easily adjust it
 * if needed by editing those two constants.
 */

// ============================================================================
// NOTES
// ============================================================================

/**
 * 1. The support modal only appears if:
 *    - showSupportModal={true} is passed
 *    - redirect exists and is enabled
 *    - redirect has primary_url or backup_url
 *
 * 2. The redirect logic is UNCHANGED:
 *    - Primary URL is used first
 *    - Backup URL is used if primary fails
 *    - Analytics RPC (increment_redirect_click) still fires
 *    - All admin configuration is respected
 *
 * 3. You can freely mix modals:
 *    - Some buttons with showSupportModal={true}
 *    - Some with showSupportModal={false}
 *    - Or leave it undefined (defaults to false)
 *
 * 4. The modal is self-contained:
 *    - No external dependencies beyond React + Lucide
 *    - No state leakage to parent
 *    - Fully animated with CSS keyframes
 *
 * 5. Mobile-friendly:
 *    - Responsive padding/font sizes
 *    - Touch-friendly button sizes
 *    - Works portrait and landscape
 */
