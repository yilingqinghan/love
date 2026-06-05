import { forwardRef, useRef, useState } from "react";

import { useOceanEcho } from "../hooks/useOceanEcho.js";

const OceanEchoScene = forwardRef(function OceanEchoScene({ echoes, lines, poems, cinemaLines }, ref) {
  const canvasRef = useRef(null);
  const [poemIndex, setPoemIndex] = useState(0);
  const [hasOpenedBottle, setHasOpenedBottle] = useState(false);
  const activePoem = poems[poemIndex];

  useOceanEcho({ sectionRef: ref, canvasRef });

  const handleTideMessage = () => {
    if (!hasOpenedBottle) {
      setHasOpenedBottle(true);
      return;
    }

    setPoemIndex((current) => (current + 1) % poems.length);
  };

  return (
    <section id="ocean-echo" ref={ref} className="ocean-echo-section" aria-label="人海回声">
      <canvas ref={canvasRef} className="ocean-canvas" aria-hidden="true"></canvas>
      <div className="ocean-vignette" aria-hidden="true"></div>

      <div className="ocean-copy">
        <p className="ocean-index">04 / Human Sea</p>
        <div className="ocean-lines-viewport">
          <div className="ocean-lines-track">
            {lines.map((line) => (
              <p className="ocean-line" key={line}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="echo-stack" aria-hidden="true">
        {echoes.map((echo, index) => (
          <article className={`echo-card e${index + 1}`} key={echo.code}>
            <span>{echo.code}</span>
            <strong>{echo.title}</strong>
            <p>{echo.detail}</p>
          </article>
        ))}
      </div>



      <div className="ocean-cinema" aria-hidden="true">
        <div className="ocean-cinema-track">
          {[...cinemaLines, ...cinemaLines].map((line, index) => (
            <article className="cinema-line" key={`${line.source}-${index}`}>
              <span>{line.source}</span>
              <strong>{line.text}</strong>
              <p>{line.note}</p>
            </article>
          ))}
        </div>
      </div>

      <div className={`ocean-bottle ${hasOpenedBottle ? "is-open" : ""}`}>
        <button className="tide-button" type="button" onClick={handleTideMessage}>
          <span>tide letter</span>
          <strong>{hasOpenedBottle ? "与你" : "潮汐"}</strong>
        </button>
        <div className="ocean-poem" aria-live="polite">
          <span>{activePoem.source}</span>
          <strong>{activePoem.text}</strong>
          <p>{activePoem.note}</p>
        </div>
      </div>

      <div className="ocean-coordinate" aria-hidden="true">
        <span>coordinate survived noise</span>
        <strong>The resonance of us</strong>
      </div>

      <div className="ocean-handoff" aria-hidden="true">
        <span></span>
        <strong>next: signal search</strong>
      </div>
    </section>
  );
});

export default OceanEchoScene;
