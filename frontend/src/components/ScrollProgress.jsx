import { useEffect, useRef, useState } from "react";

/**
 * Thin progress rail on the right edge showing scroll position —
 * doubles as the "timeline scrubber" for the backdrop.
 */
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const shown = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const p = Math.min(
        1,
        Math.max(0, window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1)),
      );
      setProgress(p);
      shown.current = window.scrollY > 40;
      document.body.classList.toggle("scrolled", shown.current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <div className="scroll-progress-fill" style={{ height: `${progress * 100}%` }} />
    </div>
  );
}
