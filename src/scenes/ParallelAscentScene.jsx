import { forwardRef, useEffect, useState } from "react";

import {
  parallelAscentLines,
  parallelAscentMilestones,
  parallelAscentPanels,
} from "../data/copy.js";
import { useParallelAscent } from "../hooks/useParallelAscent.js";
import { withBase } from "../utils/paths.js";

const ParallelAscentScene = forwardRef(function ParallelAscentScene(_, ref) {
  const [svgMarkup, setSvgMarkup] = useState("");

  useParallelAscent({
    sectionRef: ref,
    ready: Boolean(svgMarkup),
  });

  useEffect(() => {
    let alive = true;

    fetch(withBase("/parallel-ascent/index.html?v=parallel-ascent-1"))
      .then((response) => response.text())
      .then((html) => {
        if (!alive) return;
        const doc = new DOMParser().parseFromString(html, "text/html");
        const svg = doc.querySelector("svg");
        setSvgMarkup(svg ? svg.outerHTML : "");
      })
      .catch(() => {
        if (alive) setSvgMarkup("");
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section ref={ref} className="parallel-ascent-section" aria-label="学业与事业篇章">
      <div className="parallel-ascent-stage">
        <div
          className="parallel-ascent-svg"
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        ></div>
        <canvas className="parallel-collision-canvas" aria-hidden="true"></canvas>
        <canvas className="parallel-fireworks-canvas" aria-hidden="true"></canvas>
        <div className="parallel-ascent-overlay">
          <div className="parallel-ascent-haze"></div>

          <div className="parallel-ascent-title">
            <p className="parallel-ascent-kicker">08 / parallel ascent</p>
          </div>

          <article className="parallel-panel parallel-panel-left">
            <p className="parallel-panel-eyebrow">{parallelAscentPanels.left.eyebrow}</p>
            <ul className="parallel-panel-list">
              {parallelAscentPanels.left.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="parallel-panel parallel-panel-right">
            <p className="parallel-panel-eyebrow">{parallelAscentPanels.right.eyebrow}</p>
            <ul className="parallel-panel-list">
              {parallelAscentPanels.right.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <div className="parallel-axis">
            <div className="parallel-axis-line"></div>
            {parallelAscentMilestones.map((milestone, index) => (
              <div key={milestone} className={`parallel-axis-node parallel-axis-node-${index + 1}`}>
                <span className="parallel-axis-dot"></span>
                <span className="parallel-axis-label">{milestone}</span>
              </div>
            ))}
          </div>

          <div className="parallel-ascent-lines">
            <div className="parallel-ascent-lines-viewport">
              <div className="parallel-ascent-lines-track">
                {parallelAscentLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="parallel-scroll-element" aria-hidden="true"></div>
    </section>
  );
});

export default ParallelAscentScene;
