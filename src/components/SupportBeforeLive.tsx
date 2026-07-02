import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

interface Props {
  /** Controls visibility */
  open: boolean;
  onSupport?: () => void;
  onContinue?: () => void;
  onClose?: () => void:
  countdownSeconds?: number;
}

/**
 * Premium streaming-platform-inspired modal for the sponsor redirect flow.
 *
 * This is a clean, neutral UX that explains the sponsor flow without
 * feeling like a donation request. It's inspired by professional streaming
 * platforms like Netflix, Prime Video, and DAZN.
 *
 * When opened:
 * 1. Shows a clear, straightforward explanation
 * 2. User clicks "Continue" to proceed
 * 3. Shows a 20-second countdown with progress
 * 4. Automatically continues after countdown
 *
 * The redirect logic is handled by the parent (WatchLiveButton).
 * This component is purely presentational and does NOT modify any
 * redirect URLs, backend, or stream logic.
 */
export function SupportBeforeLive({
  open,
  onSupport,
  onContinue,
  onClose.
  countdownSeconds = 20,
}: Props) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"explain" | "countdown">("explain");
  const [timeRemaining, setTimeRemaining] = useState(countdownSeconds);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mount/visibility lifecycle
  useEffect(() => {
    if (open) {
      setMounted(true);
      setPhase("explain");
      setTimeRemaining(countdownSeconds);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
    }
  }, [open, countdownSeconds]);

  // Unmount after fade-out completes
  useEffect(() => {
    if (!open && mounted) {
      const t = setTimeout(() => {
        setMounted(false);
        onExited?.();
      }, 350);
      return () => clearTimeout(t);
    }
  }, [open, mounted, onExited]);

  // Countdown logic
  useEffect(() => {
    if (phase !== "countdown") return;

    countdownIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }

          onExited?. ();
          
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [phase]);

  const handleContinue = () => {
    setPhase("countdown");
    onSupport?.();
  };

  const progress = ((countdownSeconds - timeRemaining) / countdownSeconds) * 100;

  if (!mounted) return null;

  return (
    <div
      role={phase === "countdown" ? "status" : "dialog"}
      aria-live="polite"
      className={[
        "fixed inset-0 z-[110] flex items-center justify-center overflow-hidden p-4 sm:p-6",
        "transition-opacity duration-350 ease-out",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      style={{ transitionDuration: "350ms" }}
    >
      {/* Premium backdrop with subtle stadium gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 50% -20%, oklch(0.78 0.19 155 / 0.15), transparent 50%), radial-gradient(900px 600px at 100% 100%, oklch(0.55 0.15 220 / 0.08), transparent 60%), linear-gradient(135deg, oklch(0.12 0.02 250) 0%, oklch(0.10 0.01 250) 100%)",
        }}
      />

      {/* Subtle animated backdrop pulse */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, oklch(0.78 0.19 155 / 0.03) 0%, transparent 100%)',
          animation: "pulse-backdrop 4s ease-in-out infinite",
        }}
      />

      <div className="absolute inset-0 backdrop-blur-sm" />

      {/* Content card with premium glassmorphism */}
      <div
        className={[
          "relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-350 ease-out",
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0",
        ].join(" ")}
        style={{
          boxShadow:
            "0 1px 0 oklch(1 0 0 / 0.06) inset, 0 40px 80px -30px oklch(0 0 0 / 0.8), 0 0 0 1px oklch(0.78 0.19 155 / 0.10)",
        }}
      >
        {phase === "explain" ? (
          <ExplainPhase onContinue={handleContinue} />
        ) : (
          <CountdownPhase
            secondsRemaining={timeRemaining}
            totalSeconds={countdownSeconds}
            progress={progress}
          />
        )}
      </div>

      {/* Subtle decorative accent (bottom-right) */}
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full opacity-10"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.19 155) 0%, transparent 70%)",
          animation: "float-glow 6s ease-in-out infinite",
        }}
      />
    </div>
  );
}

function ExplainPhase({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight">
          Continue to Live Stream
        </h2>
      </div>

      {/* Explanation text */}
      <p className="text-center text-sm sm:text-base text-muted-foreground/95 leading-relaxed">
        Before opening the stream, a sponsor page will open. This helps us keep
        FootBeats.Live free for everyone.
      </p>

      {/* Steps section */}
      <div className="space-y-3 bg-white/5 rounded-2xl p-4 sm:p-6 border border-white/5">
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/70 uppercase tracking-widest">
          Here's what happens next
        </p>
        <div className="space-y-2.5">
          <Step number={1} text="Tap Continue" />
          <Step number={2} text="A sponsor page opens" />
          <Step number={3} text="Stay for about 20 seconds" />
          <Step number={4} text="Return to continue watching" />
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        className="group relative w-full flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-accent-green px-6 py-4 text-lg sm:text-xl font-bold text-accent-green-foreground shadow-lg shadow-accent-green/40 transition-all active:scale-[0.98] hover:brightness-110"
      >
        <span>Continue</span>
        <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>

      {/* Sponsor note */}
      <p className="text-center text-xs sm:text-sm text-muted-foreground/60">
        A sponsor page will open in a new tab.
      </p>

      {/* Thank you message */}
      <p className="text-center text-xs text-muted-foreground/50 pt-2">
        Thank you for helping keep FootBeats.Live free.
      </p>
    </div>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-accent-green/20 border border-accent-green/30 mt-0.5">
        <span className="text-sm font-semibold text-accent-green">{number}</span>
      </div>
      <p className="text-sm sm:text-base text-foreground/90 pt-0.5">{text}</p>
    </div>
  );
}

function CountdownPhase({
  secondsRemaining,
  totalSeconds,
  progress,
}: {
  secondsRemaining: number;
  totalSeconds: number;
  progress: number;
}) {
  return (
    <div className="space-y-6 text-center">
      {/* Heading */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          Sponsor Page Opening…
        </h2>
      </div>

      {/* Circular progress indicator */}
      <div className="py-4">
        <CircularProgressIndicator progress={progress} secondsRemaining={secondsRemaining} />
      </div>

      {/* Message */}
      <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed">
        We're preparing your stream. A sponsor page is open in a new tab. Please return here after viewing it.
      </p>

      {/* Progress bar */}
      <div className="space-y-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-green via-accent-green to-accent-green/70 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground/70">
          Auto-continuing in {secondsRemaining} second{secondsRemaining !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Reassurance */}
      <div className="bg-accent-green/10 rounded-xl p-3 border border-accent-green/20">
        <p className="text-xs sm:text-sm text-accent-green/90">
          ✓ Your stream is ready and waiting. You'll be taken there automatically.
        </p>
      </div>
    </div>
  );
}

function CircularProgressIndicator({
  progress,
  secondsRemaining,
}: {
  progress: number;
  secondsRemaining: number;
}) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative mx-auto flex h-32 sm:h-40 w-32 sm:w-40 items-center justify-center">
      {/* Background circle */}
      <svg
        className="absolute h-full w-full"
        style={{ transform: "rotate(-90deg)" }}
        viewBox="0 0 120 120"
      >
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-white/10"
        />
      </svg>

      {/* Progress circle */}
      <svg
        className="absolute h-full w-full transition-all duration-300"
        style={{ transform: "rotate(-90deg)" }}
        viewBox="0 0 120 120"
      >
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-accent-green transition-all duration-300"
          style={{
            filter: "drop-shadow(0 0 4px oklch(0.78 0.19 155 / 0.5))",
          }}
        />
      </svg>

      {/* Center content */}
      <div className="relative flex flex-col items-center justify-center">
        <div className="text-5xl sm:text-6xl font-bold text-accent-green">{secondsRemaining}</div>
        <div className="text-xs sm:text-sm font-medium text-muted-foreground/60 uppercase tracking-widest">
          Seconds
        </div>
      </div>

      {/* Pulsing glow background */}
      <div
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, oklch(0.78 0.19 155 / 0.4), transparent 70%)",
          animation: "pulse-ring 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

