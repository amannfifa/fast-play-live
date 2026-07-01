import { useEffect, useRef } from "react";
import { adsEnabled } from "@/lib/ads";

type Size = "leaderboard" | "mobile";

const CONFIG: Record<Size, { key: string; width: number; height: number }> = {
  leaderboard: { key: "510fe528c7a21ac544de4e48c54b181c", width: 728, height: 90 },
  mobile: { key: "5468f36324e17d5ba3d8e5899cd90232", width: 320, height: 50 },
};

/**
 * Adsterra iframe ad. Uses an isolated iframe per slot so the global
 * `atOptions` doesn't collide when multiple slots render on the same page.
 */
export function AdBanner({ size, className = "" }: { size: Size; className?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const cfg = CONFIG[size];

  useEffect(() => {
    if (!adsEnabled()) return;
    const iframe = ref.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;}</style></head><body>
<script type="text/javascript">
  atOptions = { 'key':'${cfg.key}', 'format':'iframe', 'height':${cfg.height}, 'width':${cfg.width}, 'params':{} };
<\/script>
<script src="https://www.highperformanceformat.com/${cfg.key}/invoke.js"><\/script>
</body></html>`);
    doc.close();
  }, [cfg.key, cfg.height, cfg.width]);

  if (!adsEnabled()) {
    // Show a subtle placeholder in dev/preview so layout is preserved.
    return (
      <div
        className={`mx-auto flex items-center justify-center rounded-md border border-dashed border-border/60 text-[10px] uppercase tracking-widest text-muted-foreground/60 ${className}`}
        style={{ width: cfg.width, height: cfg.height, maxWidth: "100%" }}
        aria-hidden
      >
        ad · {cfg.width}×{cfg.height}
      </div>
    );
  }

  return (
    <iframe
      ref={ref}
      title="advertisement"
      className={`mx-auto block ${className}`}
      style={{ width: cfg.width, height: cfg.height, maxWidth: "100%", border: 0 }}
      scrolling="no"
    />
  );
}

/** Responsive: mobile ad below sm, leaderboard from sm+. */
export function AdBannerResponsive({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="sm:hidden">
        <AdBanner size="mobile" />
      </div>
      <div className="hidden sm:block">
        <AdBanner size="leaderboard" />
      </div>
    </div>
  );
}