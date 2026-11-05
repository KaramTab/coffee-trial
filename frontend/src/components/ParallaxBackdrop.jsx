import { useEffect, useRef, useState } from "react";
import GifScrubPlayer from "./GifScrubPlayer.jsx";

/**
 * Fixed full-screen backdrop. Primary path: GifScrubPlayer plays the actual
 * GIF frames scrubbed by scroll (frame index = scroll progress). Fallback
 * (no animated GIF available): the coffee-beans still image in three
 * parallax layers driven by scroll. The vignette runs in both modes.
 */
export default function ParallaxBackdrop() {
  const layerA = useRef(null);
  const layerB = useRef(null);
  const layerC = useRef(null);
  const vignette = useRef(null);
  const [gifReady, setGifReady] = useState(false);

  useEffect(() => {
    const onReady = () => setGifReady(true);
    window.addEventListener("gifscrub:ready", onReady);
    return () => window.removeEventListener("gifscrub:ready", onReady);
  }, []);

  useEffect(() => {
    if (gifReady) return;
    let raf = 0;
    // current = the smoothed timeline value; target = raw scroll progress [0..1]
    let current = 0;
    let last = 0;

    const docHeight = () =>
      Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    const tick = () => {
      const target = Math.min(1, Math.max(0, window.scrollY / docHeight()));
      // Exponential smoothing: eases toward the target, then fully settles.
      current += (target - current) * 0.08;
      if (Math.abs(target - current) < 0.0002) current = target;

      // Only touch the DOM while the timeline is actually moving.
      if (current !== last) {
        // "Playhead": 0 at top of page, 1 at bottom.
        const t = current;

        // Foreground layer: largest, moves fastest, also rotates slowly to
        // make the scrub feel like footage rather than a static pan.
        const a = layerA.current;
        a.style.transform = `translate3d(${(-8 - t * 24).toFixed(2)}%, ${(t * -34).toFixed(2)}%, 0) scale(${(1.55 + t * 0.5).toFixed(3)}) rotate(${(t * 14).toFixed(2)}deg)`;
        a.style.filter = `brightness(${(0.95 - t * 0.45).toFixed(3)}) saturate(${(1.05 - t * 0.3).toFixed(3)})`;

        // Mid layer: pans the opposite way with a slight time delay feel.
        const b = layerB.current;
        b.style.transform = `translate3d(${(6 + t * 30).toFixed(2)}%, ${(t * 20).toFixed(2)}%, 0) scale(${(1.25 + t * 0.35).toFixed(3)}) rotate(${(-t * 10).toFixed(2)}deg)`;
        b.style.filter = `brightness(${(0.7 - t * 0.3).toFixed(3)}) blur(${(2 + t * 4).toFixed(1)}px)`;

        // Distant layer: slowest, deepest, most blurred.
        const c = layerC.current;
        c.style.transform = `translate3d(0, ${(t * 12).toFixed(2)}%, 0) scale(${(1.1 + t * 0.2).toFixed(3)})`;
        c.style.filter = `brightness(${(0.5 - t * 0.2).toFixed(3)}) blur(7px)`;

        last = current;
      }

      // The vignette breathes with the timeline in both modes.
      const t = current;
      if (vignette.current) {
        vignette.current.style.background =
          `radial-gradient(ellipse at 50% ${30 + t * 40}%, rgba(26,16,8,0) 30%, rgba(15,9,4,${(0.55 + t * 0.3).toFixed(2)}) 100%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gifReady]);

  return (
    <div className="backdrop" aria-hidden="true">
      <GifScrubPlayer />
      {!gifReady && (
        <>
          <div className="backdrop-layer backdrop-deep" ref={layerC} />
          <div className="backdrop-layer backdrop-mid" ref={layerB} />
          <div className="backdrop-layer backdrop-fore" ref={layerA} />
        </>
      )}
      <div className="backdrop-vignette" ref={vignette} />
    </div>
  );
}
