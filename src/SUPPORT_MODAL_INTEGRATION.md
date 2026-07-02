# Support Before Live Modal - Integration Guide

## Overview

The **Support Before Live Modal** is a premium, branded page that appears when users click "Watch Live" before they're redirected to the stream. It serves three purposes:

1. **Brand engagement** — Thanks users for supporting free streaming
2. **Monetization clarity** — Explains sponsor relationships transparently
3. **UX improvement** — Cushions the redirect-to-sponsor flow with a countdown, so users understand what's happening

## Design

- Full-screen dark backdrop with subtle animated stadium gradient
- Glassmorphism card with premium shadow and blur effects
- Two phases:
  - **Support Phase**: Hero text, "Support & Continue" button
  - **Countdown Phase**: Circular progress ring, 20-second countdown, auto-redirect messaging
- Smooth fade, scale, and animation transitions
- Fully responsive (mobile + desktop)
- Football-themed colors (green, black, white)

## What It Does

### Flow

1. User clicks "Watch Live" button
2. (Optional) Support modal opens with the support message
3. User clicks "Support & Continue"
4. Modal transitions to countdown phase (20 seconds)
5. During countdown:
   - Circular progress indicator shows time remaining
   - Horizontal progress bar fills
   - Message explains the redirect flow
6. After 20 seconds:
   - Redirect to stream URL executes
   - Modal automatically fades out
7. Stream loads (or sponsor page opens, then user closes it to get to stream)

### What It Does NOT Change

✓ **Redirect URLs** — primary_url, backup_url remain untouched  
✓ **Redirect logic** — `performRedirect()` is identical  
✓ **Analytics** — increment_redirect_click RPC still fires  
✓ **Auth** — No auth changes  
✓ **Backend** — No Supabase code modified  
✓ **Ad system** — No ad scripts, banner ads, or ad logic changed  
✓ **Admin redirects** — Admin-configured redirects work exactly as before  

This is purely a **UI layer** that improves the user experience before the existing redirect flow runs.

## Installation

### 1. Copy the files

Extract the zip into your project:
```
src/components/SupportBeforeLiveModal.tsx  (new)
src/components/WatchLiveButton.tsx          (updated)
src/styles.css                              (updated with keyframes)
```

### 2. Update your match page to enable the modal

In any file that uses `<WatchLiveButton>`, pass the `showSupportModal` prop:

```tsx
import { WatchLiveButton } from "@/components/WatchLiveButton";

export function MatchPage() {
  return (
    <WatchLiveButton 
      matchId="match-123"
      redirect={redirect}
      live={true}
      showSupportModal={true}  // Enable the support modal
    />
  );
}
```

If you don't pass `showSupportModal` or set it to `false`, the button reverts to the original 3-second "Opening Live Stream..." loading overlay.

### 3. Build and deploy

```bash
npm run build
npm run preview  # Test locally
```

## API

### WatchLiveButton Props

```tsx
interface Props {
  matchId: string;                    // Match ID for analytics
  redirect: MatchRedirect | null;     // Redirect config from Supabase
  live?: boolean;                     // true = "Watch Live Now" (red), false = "Watch Live" (green)
  showSupportModal?: boolean;         // true = show support modal, false/undefined = original loader
}
```

### SupportBeforeLiveModal Props

```tsx
interface Props {
  open: boolean;                      // Controls visibility
  onSupport?: () => void;            // Called when user clicks "Support & Continue"
  onExited?: () => void;             // Called when modal fully unmounts after fade-out
  countdownSeconds?: number;         // Countdown duration (default: 20)
}
```

## Customization

### Countdown Duration

To change the 20-second countdown:

**In WatchLiveButton.tsx:**
```tsx
const SUPPORT_COUNTDOWN_SECONDS = 30;  // Change to 30 seconds
```

**In SupportBeforeLiveModal.tsx:**
```tsx
<SupportBeforeLiveModal
  open={showSupport}
  countdownSeconds={30}  // Override for this instance
/>
```

### Colors

The modal uses the existing Tailwind design system:
- `bg-accent-green` — Button and progress indicator (matches your site)
- `text-destructive` — Heart icon (red accent)
- `text-foreground`, `text-muted-foreground` — Text hierarchy

To adjust, edit the class names in `SupportBeforeLiveModal.tsx`.

### Text

All text is hardcoded in the component. To customize:

1. **Main heading** → Search for `"Support FootBeats Live"`
2. **Subtitle** → Search for `"We keep every match free"`
3. **Button text** → Search for `"Support & Continue"`
4. **Countdown message** → Search for `"Please return to this page"`

### Animations

Keyframes are in `src/styles.css`:
- `pulse-subtle` — Backdrop pulse
- `pulse-glow` — Countdown ring glow
- `float-slow` — Decorative orb float

Adjust durations/opacities to taste.

## Performance

- Modal uses React hooks (useState, useEffect, useRef) — no external libraries
- SVG circular progress indicator (lightweight, crisp rendering)
- CSS animations (GPU-accelerated, smooth 60fps)
- Total component footprint: ~5KB gzipped

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS: backdrop-filter (supported in all modern browsers)
- SVG transforms
- requestAnimationFrame for smooth lifecycle

## Testing Checklist

- [ ] Click "Watch Live" → support modal opens
- [ ] Click "Support & Continue" → transitions to countdown
- [ ] Countdown counts down from 20 to 0
- [ ] Progress bar fills smoothly
- [ ] After 20 seconds, redirect fires
- [ ] Modal fades out after countdown
- [ ] Test on mobile (portrait/landscape)
- [ ] Test on desktop
- [ ] Disable `showSupportModal` → original loader works

## Troubleshooting

### Modal doesn't appear
- Check `showSupportModal={true}` is passed to WatchLiveButton
- Check browser console for errors
- Run `npm run build` to verify no TS errors

### Redirect doesn't fire after countdown
- Check browser console for errors in `performRedirect()`
- Verify `redirect` prop has `primary_url` and/or `backup_url`
- Check Supabase RPC call isn't failing (check browser Network tab)

### Animations look choppy
- Check GPU acceleration is enabled (DevTools > Rendering > Paint flashing)
- Reduce backdrop blur on lower-end devices if needed

## Notes for Future Developers

- The modal is **fully self-contained** — no external dependencies beyond React + Lucide icons (which you already have)
- **No state escape** — all state is local to these two components
- **No async surprises** — the only async call is `supabase.rpc()`, which is fire-and-forget (doesn't block the redirect)
- **Countdown logic** — the modal counts down internally; parent controls when to open/close via the `open` prop
- **Modal lifecycle** — Parent controls `open` → Modal handles fade-in/fade-out/unmount internally → Calls `onExited()` callback when done

## What's New

### Files Changed
- `src/components/SupportBeforeLiveModal.tsx` — **NEW** premium support modal
- `src/components/WatchLiveButton.tsx` — Updated with `showSupportModal` prop + modal integration
- `src/styles.css` — Added 4 new keyframes (`pulse-subtle`, `pulse-glow`, `float-slow`)

### Backward Compatibility

✓ **100% backward compatible** — Existing code continues to work:
- If you don't pass `showSupportModal` or pass `false`, the original 3-second loading overlay runs
- No breaking changes to component APIs
- No changes to redirect logic, URLs, or analytics

## Questions?

All the redirect logic (`performRedirect()`, Supabase RPC, URL fallbacks) is unchanged. The modal is a pure UI wrapper that appears before the existing redirect flow. If something breaks, it's likely in the modal lifecycle, not the redirect itself.
