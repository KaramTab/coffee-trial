import { useEffect, useRef } from "react";

const STEPS = [
  {
    title: "Cherry Born",
    body: "High in the hills of Brazil, a red cherry ripens in the sun — patient, sweet, and unaware of the journey ahead.",
  },
  {
    title: "Gently Washed",
    body: "The fruit gives way to water. What remains is a pale seed, cleaned of everything it no longer needs.",
  },
  {
    title: "Kissed by Fire",
    body: "Now the roast: heat coaxes out oils and turns pale to amber. The bean sings — a small crack, then a second.",
  },
  {
    title: "Ground to Dust",
    body: "The blade falls and the bean surrenders its shape. Fragrance fills the room like a memory of the mountain.",
  },
];

// Where each step card sits along the tall scroll track (percent).
const STEP_POSITIONS = [5, 23, 41, 59];
// When the bean begins its final drop into the cup (scroll progress).
const DROP_START = 0.8;

/**
 * "The Journey" — a tall scroll track with a sticky stage pinned to the
 * viewport. The bean stays dead-center while the step cards scroll past it,
 * rotating slowly like a free fall. In the last stretch the bean sinks
 * behind the cup at the bottom of the stage.
 */
export default function Journey() {
  const sectionRef = useRef(null);
  const beanRef = useRef(null);
  const finaleRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    let lastP = -1;

    const tick = () => {
      const el = sectionRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const p =
          total > 0
            ? Math.min(1, Math.max(0, -rect.top / total))
            : 0;

        if (Math.abs(p - lastP) > 0.0004) {
          const bean = beanRef.current;
          if (bean) {
            // Free-fall tumble, driven purely by scroll.
            const rotation = p * 300;

            // The bean holds the center until DROP_START, then falls
            // into the cup over the remaining scroll.
            const dropT =
              p <= DROP_START ? 0 : (p - DROP_START) / (1 - DROP_START);
            const dropY = dropT * 36; // vh
            const fade = dropT > 0.75 ? Math.max(0, 1 - (dropT - 0.75) / 0.25) : 1;

            bean.style.transform =
              `translate(-50%, -50%) translateY(${dropY.toFixed(2)}vh) rotate(${rotation.toFixed(1)}deg)`;
            bean.style.opacity = fade.toFixed(2);
          }

          const finale = finaleRef.current;
          if (finale) finale.classList.toggle("visible", p >= DROP_START);

          lastP = p;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Step cards live in the normal scroll flow — reveal them as they
  // cross the middle of the viewport, where the bean waits.
  useEffect(() => {
    const steps = sectionRef.current.querySelectorAll(".journey-step");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("visible", entry.isIntersecting);
        }
      },
      { rootMargin: "-35% 0px -35% 0px" },
    );
    steps.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="journey"
      ref={sectionRef}
      aria-label="The journey of a coffee bean"
    >
      {/* vertical timeline rail, spans the whole track */}
      <div className="journey-rail" aria-hidden="true" />

      {/* sticky stage: everything pinned to the viewport lives here */}
      <div className="journey-stage">
        <img
          className="journey-bean"
          ref={beanRef}
          src={`${import.meta.env.BASE_URL}bean.png`}
          alt=""
          aria-hidden="true"
        />

        <div className="journey-finale" ref={finaleRef}>
          <img
            className="journey-cup"
            src={`${import.meta.env.BASE_URL}cup.png`}
            alt="A paper cup of coffee"
          />
          <p className="finale-line">
            And so, after ten thousand miles — <em>it lands in your hands.</em>
          </p>
        </div>
      </div>

      {/* step cards scroll past the centered bean, alternating sides */}
      {STEPS.map((step, i) => (
        <article
          key={step.title}
          className={
            "journey-step " + (i % 2 === 0 ? "step-left" : "step-right")
          }
          style={{ top: `${STEP_POSITIONS[i]}%` }}
        >
          <span className="step-index">0{i + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </article>
      ))}
    </section>
  );
}
