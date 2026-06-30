import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  src: string;
  poster?: string;
  autoPlay?: boolean;
}

/**
 * Modular live-stream player. Accepts HLS (.m3u8), MP4, or any
 * <video>-compatible source. Auto-reconnects on fatal errors.
 * Swap the implementation here to plug in a different streaming provider.
 */
export function HlsPlayer({ src, poster, autoPlay = true }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    setLoading(true);
    setError(null);
    let destroyed = false;
    let hlsInstance: { destroy: () => void } | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const isHls = /\.m3u8(\?|$)/i.test(src);
    const attach = async () => {
      if (!video || destroyed) return;
      if (isHls && !video.canPlayType("application/vnd.apple.mpegurl")) {
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          const hls = new Hls({ lowLatencyMode: true, enableWorker: true });
          hlsInstance = hls;
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (_e: unknown, data: { fatal: boolean; type: string }) => {
            if (data.fatal) {
              setError("Stream interrupted. Reconnecting…");
              retryTimer = setTimeout(() => {
                hls.destroy();
                if (!destroyed) attach();
              }, 3000);
            }
          });
        }
      } else {
        video.src = src;
      }
      if (autoPlay) {
        try { await video.play(); } catch { /* user-gesture required */ }
      }
    };
    attach();
    const onLoaded = () => setLoading(false);
    video.addEventListener("loadeddata", onLoaded);
    return () => {
      destroyed = true;
      video.removeEventListener("loadeddata", onLoaded);
      if (retryTimer) clearTimeout(retryTimer);
      hlsInstance?.destroy();
    };
  }, [src, autoPlay]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-border">
      <video
        ref={videoRef}
        poster={poster}
        controls
        playsInline
        className="h-full w-full"
      />
      {loading && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="h-10 w-10 animate-spin text-accent-green" />
        </div>
      )}
      {error && (
        <div className="absolute inset-x-0 bottom-0 bg-black/70 p-2 text-center text-sm text-accent-green">
          {error}
        </div>
      )}
    </div>
  );
}