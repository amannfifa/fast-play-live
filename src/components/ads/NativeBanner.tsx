import { useEffect, useRef } from "react";
import { adsEnabled } from "@/lib/ads";

const CONTAINER_ID = "container-d71698e5293d95ad064682b6cef6c655";
const SCRIPT_SRC =
  "https://pl30150668.effectivecpmnetwork.com/d71698e5293d95ad064682b6cef6c655/invoke.js";

export function NativeBanner({ className = "" }: { className?: string }) {
  const mounted = useRef(false);

  useEffect(() => {
    if (!adsEnabled() || mounted.current) return;
    mounted.current = true;
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const s = document.createElement("script");
    s.async = true;
    s.setAttribute("data-cfasync", "false");
    s.src = SCRIPT_SRC;
    document.body.appendChild(s);
  }, []);

  if (!adsEnabled()) {
    return (
      <div className={`rounded-md border border-dashed border-border/60 p-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground/60 ${className}`}>
        native ad placeholder
      </div>
    );
  }

  return <div id={CONTAINER_ID} className={className} />;
}