import { forwardRef, useRef } from "react";

import { foodCardItems, foodFeastNote } from "../data/copy.js";
import { useFoodFeast } from "../hooks/useFoodFeast.js";

const FoodFeastScene = forwardRef(function FoodFeastScene(_, ref) {
  const canvasRef = useRef(null);

  useFoodFeast({
    sectionRef: ref,
    canvasRef,
  });

  return (
    <section ref={ref} className="food-feast-section" aria-label="美食主题">
      <iframe
        title="restaurant menu"
        className="food-menu-frame"
        src="/food-menu/index.html?v=foodmenu-fullscreen-1"
        loading="eager"
      ></iframe>

      <div className="food-canvas-wrap" aria-hidden="true">
        <canvas ref={canvasRef} className="food-fall-canvas"></canvas>
      </div>

      <div className="food-feast-dim" aria-hidden="true"></div>
      <div className="food-stage-header">
        <p className="food-index">07 / Taste Atlas</p>
      </div>

      <div className="food-note">
        <div className="food-note-viewport">
          <div className="food-note-track">
            {Array.isArray(foodFeastNote) ? foodFeastNote.map((line) => <p key={line}>{line}</p>) : <p>{foodFeastNote}</p>}
          </div>
        </div>
      </div>

      <div className="food-card-stack" aria-label="立体美食卡">
        {foodCardItems.map((item, index) => (
          <article
            className="food-card-shell"
            key={`${item.titleEn}-${index}`}
            style={{
              "--food-image": `url("${item.image}")`,
            }}
          >
            <div className="food-card-media"></div>
            <div className="food-card-body">
              <div className="food-card-title">
                <span className="food-card-name-en">{item.titleEn}</span>
                <span className="food-card-name-cn">{item.titleCn}</span>
              </div>
              <div className="food-card-copy">
                {item.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <div className="food-card-meta">
                <strong>{item.price}</strong>
                <span>{item.note}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});

export default FoodFeastScene;
