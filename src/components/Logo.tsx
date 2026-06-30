export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent-green text-accent-green-foreground shadow-[0_0_24px_oklch(0.78_0.19_155_/_0.6)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
      </div>
      <span className="font-display text-xl font-bold tracking-tight text-foreground">
        FootBeats<span className="text-accent-green">.Live</span>
      </span>
    </div>
  );
}