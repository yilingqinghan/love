import { forwardRef, useRef } from "react";

import { useFlightCardPlane } from "../hooks/useFlightCardPlane.js";
import { useSkyRoute } from "../hooks/useSkyRoute.js";

const SkyRouteScene = forwardRef(function SkyRouteScene({ lines }, ref) {
  const canvasRef = useRef(null);
  const planeCanvasRef = useRef(null);

  useSkyRoute({ sectionRef: ref, canvasRef });
  useFlightCardPlane({ sectionRef: ref, canvasRef: planeCanvasRef });

  return (
    <section id="sky-route" ref={ref} className="sky-route-section" aria-label="天空航路">
      <canvas ref={canvasRef} className="sky-route-canvas" aria-hidden="true"></canvas>
      <div className="sky-route-grain" aria-hidden="true"></div>
      <div className="sky-cloud-shelf shelf-back" aria-hidden="true"></div>
      <div className="sky-cloud-shelf shelf-front" aria-hidden="true"></div>

      <div className="sky-copy">
        <p className="sky-index">03 / Air Route</p>
        <div className="sky-lines-viewport">
          <div className="sky-lines-track">
            {lines.map((line) => (
              <p className="sky-line" key={line}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      <svg
        className="sky-route-map"
        viewBox="0 0 1000 620"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <path
          className="sky-route-path route-halo"
          pathLength="1"
          d="M70 430 C 210 318, 326 366, 452 252 C 598 120, 732 132, 924 176"
        />
        <path
          className="sky-route-path route-core"
          pathLength="1"
          d="M70 430 C 210 318, 326 366, 452 252 C 598 120, 732 132, 924 176"
        />
        <circle className="route-node n1" cx="70" cy="430" r="5" />
        <circle className="route-node n2" cx="452" cy="252" r="5" />
        <circle className="route-node n3" cx="924" cy="176" r="5" />
        <text className="route-label label-1" x="76" y="410">
          0.000513%
        </text>
        <text className="route-label label-2" x="462" y="232">
          WIND RECEIVES IT
        </text>
        <text className="route-label label-3" x="770" y="160">
          HUMAN SKY
        </text>
      </svg>

      <div className="paper-plane" aria-hidden="true">
        <svg viewBox="0 0 190 116" role="img" aria-label="paper plane">
          <path className="plane-wing main" d="M8 56 L178 8 L125 108 L92 69 Z" />
          <path className="plane-wing fold" d="M92 69 L178 8 L72 78 Z" />
          <path className="plane-wing shade" d="M92 69 L125 108 L72 78 Z" />
          <path className="plane-crease" d="M92 69 L125 108" />
          <path className="plane-crease" d="M72 78 L178 8" />
        </svg>
        <span>0.000513%</span>
      </div>

      <div className="plane-shadow" aria-hidden="true"></div>

      <aside className="sky-flight-card" aria-hidden="true">
        <div className="flight-card-border"></div>
        <div className="flight-card-top">
          <div>
            <span className="flight-card-label">private flight</span>
            <strong>ENFJ-ARI 000513</strong>
          </div>
          <div className="flight-status">
            <span className="flight-status-dot"></span>
            ready
          </div>
        </div>

        <div className="flight-plane-preview">
          <canvas ref={planeCanvasRef} aria-hidden="true"></canvas>
          <span>if distance happens, I fly.</span>
        </div>

        <div className="flight-route">
          <div className="flight-route-box from">
            <span>from</span>
            <strong>ME</strong>
            <em>2001.03.28</em>
          </div>
          <div className="flight-duration">
            <svg viewBox="-40 -10 700 200" role="img" aria-label="route progress">
              <path
                className="flight-progress-base"
                d="M4 143C100.5 38.3333 356.3 -108.2 607.5 143"
              />
              <path
                className="flight-progress-path"
                pathLength="1"
                d="M4 143C101 38.5 321.5 -78.4999 543 87"
              />
            </svg>
            <span>whenever you need me</span>
          </div>
          <div className="flight-route-box to">
            <span>to</span>
            <strong>YOU</strong>
            <em>wherever you are</em>
          </div>
        </div>

        <div className="flight-stats">
          <div className="flight-stat">
            <span>ETA</span>
            <strong>anytime</strong>
          </div>
          <div className="flight-stat">
            <span>ALT</span>
            <strong>distance</strong>
          </div>
          <div className="flight-stat">
            <span>PITCH</span>
            <strong>3.28°</strong>
          </div>
        </div>
      </aside>

      <div className="kite-rig" aria-hidden="true">
        <span className="kite-string"></span>
        <span className="kite"></span>
      </div>

      <div className="balloon balloon-one" aria-hidden="true">
        <span></span>
      </div>
      <div className="balloon balloon-two" aria-hidden="true">
        <span></span>
      </div>

      <div className="sky-handoff" aria-hidden="true">
        <span></span>
        <strong>next: human sea</strong>
      </div>
    </section>
  );
});

export default SkyRouteScene;
