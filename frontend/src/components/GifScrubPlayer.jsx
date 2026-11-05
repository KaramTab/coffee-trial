import { useEffect, useRef, useState } from "react";
import { decompressFrames, parseGIF } from "gifuct-js";

/**
 * Scroll-scrubbed GIF player. The GIF's frames are its timeline:
 * scrolling down advances the frame index, scrolling up rewinds it,
 * and it freezes on the exact frame when scrolling stops.
 *
 * If /coffee-beans.gif is absent (e.g. the asset was flattened to a
 * static PNG), this renders nothing and the layered parallax fallback
 * in ParallaxBackdrop takes over.
 */
export default function GifScrubPlayer() {
  const canvasRef = useRef(null);
  const framesRef = useRef(null);
  const [failed, setFailed] = useState(false);

  // Decode once: parse the GIF, composite each frame onto its own canvas
  // (GIF frames can be partial patches, so they must be merged in order).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // BASE_URL keeps the path correct both at / (dev) and /coffee-trial/ (Pages)
        const res = await fetch(`${import.meta.env.BASE_URL}coffee-beans.gif`);
        if (!res.ok) throw new Error(`no gif (${res.status})`);
        const buffer = await res.arrayBuffer();
        const gif = parseGIF(buffer);
        const rawFrames = decompressFrames(gif, true);

        const frames = [];
        let compose = document.createElement("canvas");
        compose.width = gif.lsd.width;
        compose.height = gif.lsd.height;
        const ctx = compose.getContext("2d");
        let frameImgData = null;

        for (const frame of rawFrames) {
          if (frame.disposalType === 2) ctx.clearRect(0, 0, compose.width, compose.height);
          // drawImage needs an ImageBitmap/HTMLImageElement — build one per patch
          const patchCanvas = document.createElement("canvas");
          patchCanvas.width = frame.dims.width;
          patchCanvas.height = frame.dims.height;
          patchCanvas.getContext("2d").putImageData(
            new ImageData(frame.patch, frame.dims.width, frame.dims.height),
            0,
            0,
          );
          ctx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);
          // snapshot the composited state for this frame
          const snap = document.createElement("canvas");
          snap.width = compose.width;
          snap.height = compose.height;
          snap.getContext("2d").drawImage(compose, 0, 0);
          frames.push(snap);
          frameImgData = frame;
        }
        if (frames.length < 2) throw new Error("gif has a single frame");
        if (!cancelled) {
          framesRef.current = frames;
          window.dispatchEvent(new Event("gifscrub:ready"));
        }
      } catch (e) {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The scrub loop: smoothed scroll progress [0..1] → frame index.
  // Only paints while the index actually changes, so idle = frozen frame.
  useEffect(() => {
    if (failed) return;
    let raf = 0;
    let current = 0;
    let lastPainted = -1;

    const tick = () => {
      const frames = framesRef.current;
      if (frames) {
        const doc = document.documentElement;
        const target = Math.min(
          1,
          Math.max(0, window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight)),
        );
        current += (target - current) * 0.12;
        if (Math.abs(target - current) < 0.0005) current = target;

        const idx = Math.min(
          frames.length - 1,
          Math.round(current * (frames.length - 1)),
        );
        if (idx !== lastPainted) {
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = frames[idx].width;
            canvas.height = frames[idx].height;
            canvas.getContext("2d").drawImage(frames[idx], 0, 0);
            lastPainted = idx;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [failed]);

  if (failed) return null;

  return (
    <canvas
      ref={canvasRef}
      className="gif-scrub-player"
      aria-hidden="true"
    />
  );
}
