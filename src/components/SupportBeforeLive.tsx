import { useEffect, useRef, useState } from "react";
import { Heart, PlayCircle, X } from "lucide-react";
import stadiumBg from "@/assets/stadium-bg.jpg";
import { Logo } from "./Logo";

interface Props {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  /** Called once when user clicks the support button (fire your ad here). */
  onSupport: () => void;
  countdownSeconds?: number;
}

/**
 * Full-screen premium "Support Before Live Stream" overlay.
 * Preserves parent's redirect/ad logic — this component only handles UI + timing.
 */
export function SupportBeforeLive({
  open,
  onClose,
  onContinue,
  onSupport,
  countdownSeconds = 20,
}: Props) {
  const [started, setStarted] = useState(false);
  const [remaining, setRemaining] = useState(countdownSeconds);
  const continuedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setStarted(false);
      setRemaining(countdownSeconds);
      continuedRef.current = false;
    }
  }, [open, countdownSeconds]);

  useEffect(() => {
    if (!started) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          if (!continuedRef.current) {
            continuedRef.current = true;
            onContinue();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, onContinue]);

  if (!open) return null;

  const progress = ((countdownSeconds - remaining) / countdownSeconds) * 100;
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ * (1 - progress / 100);

  const handleSupport = () => {
    try { onSupport(); } catch { /* ignore */ }
    setStarted(true);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-background" />
      <img
        src={stadiumBg}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-30 blur-md scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background/95" />

      {/* Close */}
      {!started && (
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-foreground/80 backdrop-blur transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Glass card */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-8 animate-scale-in"
        style={{ boxShadow: "0 30px 80px -20px oklch(0 0 0 / 0.6)" }}
      >
        <div className="mb-6 flex items-center justify-center">
          <Logo />
        </div>

        {!started ? (
          <>
            <h2 className="font-display text-center text-2xl font-extrabold leading-tight sm:text-3xl">
              Support FootBeats Live <span className="inline-block">❤️</span>
            </h2>
            <p className="mt-3 text-center text-sm text-muted-foreground sm:text-base">
              We keep every match free to watch. Opening one sponsor helps cover our streaming costs.
            </p>

            <button
              onClick={handleSupport}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-green px-6 py-4 text-base font-bold text-accent-green-foreground shadow-lg shadow-accent-green/30 transition hover:brightness-110 active:scale-[0.99] sm:text-lg"
            >
              <Heart className="h-5 w-5" />
              Support &amp; Continue
            </button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              One sponsor helps keep FootBeats Live free for everyone.
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display text-center text-xl font-bold sm:text-2xl">
              Thank you for supporting us
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Please return to this page after viewing the sponsor. You&apos;ll automatically continue to the live stream.
            </p>

            {/* Circular countdown */}
            <div className="relative mx-auto mt-6 flex h-32 w-32 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-white/10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={dashOffset}
                  className="text-accent-green transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
              </svg>
              <div className="text-center">
                <div className="font-display text-4xl font-extrabold tabular-nums text-foreground">
                  {remaining}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  seconds
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-accent-green transition-[width] duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <PlayCircle className="h-4 w-4 animate-pulse text-accent-green" />
              Preparing your live stream…
            </div>
          </>
        )}
      </div>
    </div>
  );
}