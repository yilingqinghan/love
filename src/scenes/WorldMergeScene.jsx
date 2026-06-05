import { forwardRef } from "react";

const WorldMergeScene = forwardRef(function WorldMergeScene(
  { leftFragments, rightFragments },
  ref
) {
  return (
    <section ref={ref} className="world-section" aria-label="世界观重合">
      <div className="world-title">
        <p>Two disciplines, one runtime</p>
        <h2>世界观开始重合</h2>
      </div>

      <div className="world-column world-left" aria-hidden="true">
        {leftFragments.map((item, index) => (
          <pre className={`world-fragment f${index + 1}`} key={item}>
            {item}
          </pre>
        ))}
      </div>

      <div className="world-column world-right" aria-hidden="true">
        {rightFragments.map((item, index) => (
          <pre className={`world-fragment f${index + 1}`} key={item}>
            {item}
          </pre>
        ))}
      </div>

      <div className="convergence-symbol" aria-hidden="true">
        <svg viewBox="0 0 360 180" role="img" aria-label="infinity">
          <path
            className="infinity-path"
            d="M180 90 C130 25, 54 28, 54 90 C54 152, 130 155, 180 90 C230 25, 306 28, 306 90 C306 152, 230 155, 180 90"
          />
        </svg>
      </div>
    </section>
  );
});

export default WorldMergeScene;
