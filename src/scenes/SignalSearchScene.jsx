import { forwardRef, useRef } from "react";

import { signalCandidates, signalTags } from "../data/copy.js";
import { useSignalSearch } from "../hooks/useSignalSearch.js";

const SignalSearchScene = forwardRef(function SignalSearchScene(_, ref) {
  const canvasRef = useRef(null);

  useSignalSearch({ sectionRef: ref, canvasRef });

  return (
    <section ref={ref} className="signal-section" aria-label="搜索信号">
      <canvas ref={canvasRef} className="signal-canvas" aria-hidden="true"></canvas>

      <div className="signal-grain" aria-hidden="true"></div>
      <div className="signal-reticle" aria-hidden="true">
        <span className="reticle-line horizontal"></span>
        <span className="reticle-line vertical"></span>
        <span className="reticle-core"></span>
      </div>

      <div className="signal-copy">
        <p className="signal-index">Scene 06 · Signal Search</p>
        <h2>Searching the improbable coordinate.</h2>
        <p className="signal-cn">不是暴力匹配，是一次回响。</p>
      </div>

      <div className="signal-axis" aria-hidden="true">
        <span>X: LOGIC_AXIS</span>
        <span>Y: AESTHETIC_FIELD</span>
        <span>Z: LEGAL_GRAVITY</span>
      </div>

      <div className="signal-stages" aria-live="polite">
        <p className="signal-stage stage-1">scan / unknown coordinate</p>
        <p className="signal-stage stage-2">noise rejected</p>
        <p className="signal-stage stage-3">CAFA / Law / Fire</p>
        <p className="signal-stage stage-4">lock / because it stayed</p>
      </div>

      <div className="candidate-stack" aria-hidden="true">
        {signalCandidates.map((candidate, index) => (
          <article className={`candidate-card c${index + 1}`} key={candidate.id}>
            <span>{candidate.id}</span>
            <strong>{candidate.status}</strong>
          </article>
        ))}
      </div>

      <div className="signal-tags" aria-hidden="true">
        {signalTags.map((tag, index) => (
          <span className={`signal-tag t${index + 1}`} key={tag}>
            {tag}
          </span>
        ))}
      </div>

      <div className="signal-status" aria-hidden="true">
        <span>searching unknown resonance...</span>
        <span>sampling voice frequency...</span>
        <span>checking improbable coordinate...</span>
      </div>
    </section>
  );
});

export default SignalSearchScene;
