import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Loader2, ShieldCheck, X } from "lucide-react";

interface Props {
  open: boolean;
  /** Called once the user presses "Support & Continue". Fire your ad here. */
  onSupport: () => void;
  /** Called after the countdown completes. Must run the existing redirect. */
  onContinue: () => void;
  /** Called when the user dismisses before the countdown finishes. */
  onClose: () => void;
  seconds?: number;
}

/**
 * Premium "Support before live" overlay.
 * - Accessible: focus trap, ESC to close, aria-modal, aria-live status.
 * - Respects prefers-reduced-motion.
 * - Does NOT touch ad or redirect logic — it just calls the two callbacks.
 */
export function SupportBeforeLive({ open, onSupport, onContinue, onClose, seconds = 20 }: Props) {
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(seconds);
  const dialogRef = useRef<HTMLDivElement>(null);
  const supportBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const firedRef = useRef(false);

  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // Reset internal state whenever the modal is re-opened.
  useEffect(() => {
    if (open) {
      setStarted(false);
      setRemaining(seconds);
      firedRef.current = false;
    }
  }, [open, seconds]);

  // Countdown tick.
  useEffect(() => {
    if (!open || !started) return;
    if (remaining <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onContinue();
      }
      return;
    }
    const t = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [open, started, remaining, onContinue]);

  // Focus management + ESC + focus trap.
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    // move focus into dialog
    requestAnimationFrame(() => supportBtnRef.current?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const total = seconds;
  const progress = ((total - remaining) / total) * 100;
  const circumference = 2 * Math.PI * 46;
  const dash = (progress / 100) * circumference;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-title"
      aria-describedby="support-desc"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15),transparent_60%),linear-gradient(180deg,#050807_0%,#02060a_100%)] ${
          reducedMotion ? "" : "animate-in fade-in duration-300"
        }`}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30 mix-blend-screen"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(52,211,153,0.35), transparent 40%), radial-gradient(circle at 80% 70%, rgba(20,184,166,0.25), transparent 45%)",
        }}
      />

      <div
        ref={dialogRef}
        className={`relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8 ${
          reducedMotion ? "" : "animate-in fade-in zoom-in-95 duration-300"
        }`}
      >
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close and return"
          className="absolute right-3 top-3 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-2 text-white/80">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-wide">FootBeats Live</span>
          </div>

          <h2
            id="support-title"
            className="flex items-center gap-2 text-2xl font-extrabold text-white sm:text-3xl"
          >
            Support FootBeats Live
            <Heart className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          </h2>

          <p id="support-desc" className="mt-3 max-w-sm text-sm text-white/70 sm:text-base">
            We keep every match free to watch. Opening one sponsor helps cover our streaming costs.
          </p>

          {!started ? (
            <>
              <button
                ref={supportBtnRef}
                onClick={() => {
                  onSupport();
                  setStarted(true);
                }}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 text-base font-bold text-black shadow-lg shadow-emerald-500/30 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-[0.98] sm:text-lg"
              >
                <ShieldCheck className="h-5 w-5" />
                Support &amp; Continue
              </button>
              <p className="mt-4 text-xs text-white/50">
                One sponsor helps keep FootBeats Live free for everyone.
              </p>
            </>
          ) : (
            <div className="mt-8 flex flex-col items-center" aria-live="polite" aria-atomic="true">
              <div className="relative h-32 w-32">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="46" strokeWidth="6" className="fill-none stroke-white/10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="fill-none stroke-emerald-400"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - dash}
                    style={reducedMotion ? undefined : { transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white tabular-nums">{remaining}</span>
                  <span className="text-[10px] uppercase tracking-widest text-white/50">seconds</span>
                </div>
              </div>

              <div
                className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-label="Time until stream opens"
              >
                <div
                  className="h-full bg-emerald-400"
                  style={{
                    width: `${progress}%`,
                    transition: reducedMotion ? undefined : "width 1s linear",
                  }}
                />
              </div>

              <p className="mt-5 flex items-center justify-center gap-2 text-sm text-white/70">
                <Loader2 className={`h-4 w-4 ${reducedMotion ? "" : "animate-spin"}`} aria-hidden="true" />
                Please return to this page after viewing the sponsor. You'll automatically continue to the live stream.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}