This is a very large request. To ship something high-quality without blowing scope, I'll break it into 4 focused phases. Phase 1 covers your must-haves (ads + redirect manager). Phases 2–4 layer on the UI/UX polish and future-ready structure without touching branding.

## Phase 1 — Ads Integration + Redirect Manager (this iteration)

### Ads
Add all 6 Adsterra/HighPerformanceFormat snippets:
- Two head-level scripts (728x90 + 320x50 iframe loaders) → injected via TanStack `head()` in `__root.tsx` so they load site-wide.
- Head close script (`0485b4dee56040232a2b288906aca6bb.js`) → added as a `scripts` entry on the root route.
- Body-close script (`35b244e72207f0881689624767a3956e.js`) → mounted in root layout after `<Outlet />` via a client-only `<AdScript>` component.
- Native banner (`d71698e5293d95ad064682b6cef6c655`) → new `<NativeBanner />` component placed on Home page below match list.
- Direct link (`ba1598zhi?key=...`) → wired into a "Sponsored" text link in the footer/nav area.
- Two iframe ad slots (728x90 desktop, 320x50 mobile) → `<AdBanner size="leaderboard|mobile" />` component with responsive show/hide, placed on Home top and Match page.

All ad scripts render only in production (skip in Lovable preview to avoid CSP/iframe issues), lazy-loaded, and never block first paint.

### Redirect Manager (DB + Admin + Runtime)

**Schema (migration):**
- New table `match_redirects`:
  - `match_id` (uuid, FK → matches.id, unique)
  - `primary_url` (text)
  - `backup_url` (text nullable)
  - `open_in_new_tab` (bool, default true)
  - `enabled` (bool, default true)
  - `click_count` (int, default 0)
  - `clicks_today` (int, default 0)
  - `last_clicked_at` (timestamptz nullable)
  - `last_reset_date` (date)
  - timestamps + update trigger
- Columns reserved for future: `country_overrides` (jsonb), `scheduled_switch_at`, `scheduled_url`, `provider` (text).
- RLS: public SELECT (needed to read redirect on match page), admin-only write; GRANTs to anon/authenticated/service_role.
- `increment_redirect_click(match_id uuid)` SECURITY DEFINER function to bump counters atomically + reset daily counter.

**Admin page** (`/admin` → new "Redirect Manager" tab):
- Table: Match ID (short) · Home · Away · Current URL · Status · Edit.
- Edit modal (shadcn Dialog): primary URL, backup URL, open-in-new-tab toggle, enabled toggle, Save.
- URL validation with zod: must start with `https://`.
- Analytics strip at top: total clicks, clicks today, last redirect time.
- Auto-creates a redirect row for any match that doesn't have one.

**Runtime wiring:**
- "Watch Live" button on Match page reads the redirect row (Realtime subscription for instant updates).
- On click: calls `increment_redirect_click` then `window.open(primary_url, target)` with backup fallback if primary fails.
- No hardcoded stream links anywhere.

## Phase 2 — Home & Match UX polish (next iteration)

- Featured "NEXT MATCH" hero with big countdown → glowing "WATCH LIVE" swap at kickoff.
- MatchCard: bigger names, softer shadows, hover lift, refined status badges (blue upcoming / red pulsing live / grey finished).
- Filter chips: Live · Today · Upcoming · Finished, combinable with competition.
- Search box: instant filter by team + competition + recent-searches (localStorage).
- Auto-refresh matches every 60s via `refetchInterval`.
- Skeleton loaders + fade-in animations.

## Phase 3 — Match page premium polish

- Larger animated countdown, kickoff datetime, updated messaging.
- Competition badge header, larger flags, premium VS separator.
- Info cards: venue, city, kickoff, timezone, capacity (placeholder), weather (placeholder).
- Action row: Share · Notify Me · Add to Favorites (favorites in localStorage for now).
- Placeholder panels: Preview, H2H, Recent Form, Predicted Lineups, Timeline, Stats — structured so a future API drop-in works.
- Live mode & finished mode auto-switching driven by status.

## Phase 4 — Foundations for the mega-list (favorites, live chat, i18n, notifications, richer admin, PWA offline page, SEO/sitemap)

Broken out because each is substantial. I'll surface them as follow-up plans once Phases 1–3 land, so we don't ship half-finished features.

## Technical notes
- Ads: `<script>` tags injected via TanStack `head()` for head scripts; runtime-injected `<script>` elements (with `document.createElement`) inside a `useEffect` for body-close and iframe ad units, guarded by `import.meta.env.PROD` + hostname check so Lovable preview stays clean.
- Redirect Manager: `createServerFn` not needed — public SELECT + admin-gated writes go through the browser Supabase client with RLS. Click increment via RPC.
- Realtime: `match_redirects` added to `supabase_realtime` publication so admin edits appear on match pages instantly.
- All new UI uses existing tokens (`accent-green`, `card-elevated`, `live-red`) — zero branding drift.

**Confirming before I start Phase 1?** Reply "go" and I'll ship ads + redirect manager in this turn. If you want a different order (e.g. UI polish first), say so.