/**
 * Full-height cinematic hero. The headline eases in with the page load;
 * a scroll cue hints that the page (and its backdrop timeline) is scrubbed.
 */
export default function Hero() {
  return (
    <section className="hero">
      <p className="hero-eyebrow">Kedai Kopi · Est. 2026</p>
      <h2 className="hero-title">
        Scroll to brew
        <span className="hero-title-accent">your perfect cup</span>
      </h2>
      <p className="hero-lede">
        Six signatures, roasted dark, poured with pride.
        Your order scrolls with you — literally.
      </p>
      <div className="hero-cue" aria-hidden="true">
        <span className="hero-cue-track">
          <span className="hero-cue-dot" />
        </span>
        scroll
      </div>
    </section>
  );
}
