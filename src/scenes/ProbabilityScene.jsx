import { forwardRef, useRef } from "react";

import { useProbabilityField } from "../hooks/useProbabilityField.js";
import { withBase } from "../utils/paths.js";

const typeGroups = {
  INTJ: "analyst",
  INTP: "analyst",
  ENTJ: "analyst",
  ENTP: "analyst",
  INFJ: "diplomat",
  INFP: "diplomat",
  ENFJ: "diplomat",
  ENFP: "diplomat",
  ISTJ: "sentinel",
  ISFJ: "sentinel",
  ESTJ: "sentinel",
  ESFJ: "sentinel",
  ISTP: "explorer",
  ISFP: "explorer",
  ESTP: "explorer",
  ESFP: "explorer",
};

const mbtiAssets = {
  INTJ: withBase("/assets/mbti/intj-architect-male.svg"),
  INTP: withBase("/assets/mbti/intp-logician-female.svg"),
  ENTJ: withBase("/assets/mbti/entj-commander-female.svg"),
  ENTP: withBase("/assets/mbti/entp-debater-male.svg"),
  INFJ: withBase("/assets/mbti/infj-advocate-male.svg"),
  INFP: withBase("/assets/mbti/infp-mediator-female.svg"),
  ENFJ: withBase("/assets/mbti/enfj-protagonist-male.svg"),
  ENFP: withBase("/assets/mbti/enfp-campaigner-female.svg"),
  ISTJ: withBase("/assets/mbti/istj-logistician-male.svg"),
  ISFJ: withBase("/assets/mbti/isfj-defender-female.svg"),
  ESTJ: withBase("/assets/mbti/estj-executive-female.svg"),
  ESFJ: withBase("/assets/mbti/esfj-consul-male.svg"),
  ISTP: withBase("/assets/mbti/istp-virtuoso-male.svg"),
  ISFP: withBase("/assets/mbti/isfp-adventurer-female.svg"),
  ESTP: withBase("/assets/mbti/estp-entrepreneur-male.svg"),
  ESFP: withBase("/assets/mbti/esfp-entertainer-female.svg"),
};

const probabilityNarrative = [
  "在很大的宇宙里，星星各自运行。",
  "有的相隔亿万光年，有的只在某个瞬间擦肩。",
  "而我们，竟然在同一颗蓝色星球上，",
  "出生、长大、奔赴各自的理想，",
  "又在某个不早不晚的时刻，",
  "轻轻地遇见了彼此。",
  "2001.03.28",
  "一颗热烈的白羊星，来到人间。",
  "2002.04.12",
  "另一颗明亮的白羊星，也悄悄升起。",
  "我们都带着火象的温度，",
  "也都藏着 ENFJ 的柔软与理想。",
  "热情、真诚、敏感、相信爱，",
  "也相信人和人之间，真的会有某种奇妙的同频。",
  "在所有擦肩而过的可能里，",
  "我们没有错过。",
  "在所有沉默的人海里，",
  "我们偏偏听见了彼此。",
  "在所有星轨交错的夜晚，",
  "你的光，刚好落进了我的眼睛。",
  "也许相遇本身，就是一个很小很小的概率。",
  "可当它真的发生，",
  "那些数字、星图、轨迹与巧合，",
  "便忽然都有了温柔的意义。",
  "原来世界这么大，",
  "我还是可以遇见你。",
  "原来星河这么远，",
  "两颗相似的星星，",
  "也真的会在某一天，",
  "找到彼此。",
];

const ProbabilityScene = forwardRef(function ProbabilityScene(
  { typeCodes, zodiacSigns, probabilityRows },
  ref
) {
  const canvasRef = useRef(null);
  useProbabilityField({ sectionRef: ref, canvasRef });

  return (
    <section ref={ref} className="probability-section" aria-label="概率筛选">
      <canvas ref={canvasRef} className="probability-canvas" aria-hidden="true"></canvas>
      <div className="probability-vignette" aria-hidden="true"></div>

      <div className="probability-heading">
        <p>02 / Coincidence Engine</p>
      </div>

      <div className="selector-stage" aria-hidden="true">
        <div className="orbit-system mbti-system">
          <span className="orbit-caption">16 MBTI</span>
          <div className="selector-ring mbti-ring">
            {typeCodes.map((type, index) => (
              <span
                className={`orbit-token mbti-token ${typeGroups[type]} ${
                  type === "ENFJ" ? "selected" : ""
                }`}
                key={type}
                style={{ "--angle": `${(360 / typeCodes.length) * index}deg` }}
              >
                <img src={mbtiAssets[type]} alt="" loading="eager" />
                <strong>{type}</strong>
              </span>
            ))}
          </div>
        </div>

        <div className="orbit-system zodiac-system">
          <span className="orbit-caption">12 SIGNS</span>
          <div className="selector-ring zodiac-ring">
            {zodiacSigns.map((sign, index) => (
              <span
                className={`orbit-token zodiac-orbit-token zodiac-${sign.element} ${
                  sign.code === "Aries" ? "selected" : ""
                }`}
                key={sign.code}
                style={{ "--angle": `${(360 / zodiacSigns.length) * index}deg` }}
              >
                <strong>{sign.glyph}</strong>
                <em>{sign.cn}</em>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="pair-narrative" aria-hidden="true">
        <div className="pair-narrative-viewport">
          <div className="pair-narrative-track">
            {probabilityNarrative.map((line, index) => (
              <p
                className={`narrative-line ${
                  index >= probabilityNarrative.length - 4 ? "narrative-line-closing" : ""
                } ${index === probabilityNarrative.length - 1 ? "narrative-line-highlight" : ""}`.trim()}
                key={`${index}-${line}`}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
        <div className="pair-thread">
          <span className="pair-person male">他 · 2001.03.28 · ENFJ 白羊 · 0.181%</span>
          <i></i>
          <span className="pair-person female">她 · 2002.04.12 · ENFJ 白羊 · 0.284%</span>
        </div>
      </div>

      <div className="selection-core" aria-hidden="true">
        <div className="selected-badge pair-badge male-badge">
          <img src={withBase("/assets/mbti/enfj-protagonist-male.svg")} alt="" />
          <div>
            <small>他 / 2001.03.28 / ENFJ 白羊</small>
            <strong>0.181%</strong>
          </div>
        </div>
        <div className="core-join">×</div>
        <div className="selected-badge pair-badge female-badge">
          <div className="female-sigil">♈︎</div>
          <div>
            <small>她 / 2002.04.12 / ENFJ 白羊</small>
            <strong>0.284%</strong>
          </div>
        </div>
      </div>

      <div className="probability-strip">
        {probabilityRows.map((row, index) => (
          <article className={`probability-tile ${row.featured ? "featured" : ""}`} key={row.label}>
            <span>{row.short ?? row.label}</span>
            <strong>{row.value}</strong>
            <i style={{ "--bar-scale": `${Math.max(0.08, 1 - index * 0.145)}` }}></i>
          </article>
        ))}
      </div>

      <div className="probability-equation" aria-hidden="true">
        <span>0.181%</span>
        <b>×</b>
        <span>0.284%</span>
        <b>=</b>
        <strong>0.000513%</strong>
      </div>
    </section>
  );
});

export default ProbabilityScene;
