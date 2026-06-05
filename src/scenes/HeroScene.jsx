import { forwardRef } from "react";

const HeroScene = forwardRef(function HeroScene(_, ref) {
  return (
    <section ref={ref} className="hero" aria-label="主视觉">
      <div className="hero-bg" aria-hidden="true">
        <iframe
          title="star trek hero background"
          className="hero-star-trek-frame"
          src="/star-trek/index.html?v=hero-1"
          loading="eager"
        ></iframe>
      </div>
      <div className="scroll-mark" aria-hidden="true"></div>
    </section>
  );
});

export default HeroScene;
