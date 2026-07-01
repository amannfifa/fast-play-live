import { useEffect } from "react";
import { adsEnabled } from "@/lib/ads";

const HEAD_SRC = "https://pl30150665.effectivecpmnetwork.com/04/85/b4/0485b4dee56040232a2b288906aca6bb.js";
const BODY_SRC = "https://pl30150666.effectivecpmnetwork.com/35/b2/44/35b244e72207f0881689624767a3956e.js";

/** Injects the two global ad scripts once on the client. */
export function GlobalAdScripts() {
  useEffect(() => {
    if (!adsEnabled()) return;
    const inject = (src: string, parent: HTMLElement) => {
      if (document.querySelector(`script[src="${src}"]`)) return;
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      parent.appendChild(s);
    };
    inject(HEAD_SRC, document.head);
    inject(BODY_SRC, document.body);
  }, []);
  return null;
}