import { forwardRef, useEffect, useMemo, useRef, useState } from "react";

const DAY_MS = 24 * 60 * 60 * 1000;

const ANNIVERSARY_LINES = [
  "一起看风景，也一起把日常过亮。",
  "一起做饭、养猫、回家，练习很长久的喜欢。",
  "故事没有停在表白，它从今天开始认真生长。",
];

const CERTIFICATE_ROWS = [
  ["PAIR LOCK", "0.000513%"],
  ["ORBIT", "ENFJ × Aries"],
  ["ROUTE", "star / sky / sea / home"],
  ["VALID", "long-term tenderness"],
];

const FUTURE_UNLOCKS = ["一起旅行", "一起做饭", "一起养猫", "一起回家"];

function formatDateLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function getDaysTogether(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 1;
  const now = new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(1, Math.floor((today - start) / DAY_MS) + 1);
}

const AnniversaryScene = forwardRef(function AnniversaryScene({ startDate }, ref) {
  const [displayDays, setDisplayDays] = useState(1);
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef(null);

  const daysTogether = useMemo(() => getDaysTogether(startDate), [startDate]);
  const dateLabel = useMemo(() => formatDateLabel(startDate), [startDate]);

  useEffect(() => {
    const target = cardRef.current;
    if (!target) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated) return;
        setHasAnimated(true);
      },
      { threshold: 0.45 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) {
      setDisplayDays(daysTogether);
      return undefined;
    }

    let frameId = 0;
    const duration = 1200;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayDays(Math.max(1, Math.round(daysTogether * eased)));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      }
    };

    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [daysTogether, hasAnimated]);

  return (
    <section ref={ref} id="anniversary-scene" className="anniversary-section" aria-label="纪念日页面">
      <div className="anniversary-stage">
        <div className="anniversary-glow anniversary-glow-1" aria-hidden="true"></div>
        <div className="anniversary-glow anniversary-glow-2" aria-hidden="true"></div>

        <div className="anniversary-balloons" aria-hidden="true">
          <div className="anniversary-balloon anniversary-balloon-1">
            <span>L</span>
          </div>
          <div className="anniversary-balloon anniversary-balloon-2">
            <span>O</span>
          </div>
          <div className="anniversary-balloon anniversary-balloon-3">
            <span>V</span>
          </div>
        </div>

        <article ref={cardRef} className="anniversary-card">
          <p className="anniversary-kicker">10 / Since We Said Yes</p>
          <h2 className="anniversary-title">逸翎清晗 和 小一</h2>

          <div className="anniversary-counter">
            <span className="anniversary-count">{displayDays}</span>
            <div className="anniversary-counter-copy">
              <p>在一起</p>
              <p>天了</p>
            </div>
          </div>

          <p className="anniversary-start">记于 {dateLabel || "今天"}</p>

          <div className="anniversary-certificate-grid" aria-label="纪念证书信息">
            {CERTIFICATE_ROWS.map(([label, value]) => (
              <div key={label} className="anniversary-certificate-cell">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="anniversary-ribbons" aria-hidden="true">
            <span>ENFJ × Aries</span>
            <span>0.000513%</span>
            <span>from confession to forever</span>
          </div>

          <div className="anniversary-lines">
            {ANNIVERSARY_LINES.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="anniversary-future-list" aria-label="未来待解锁">
            {FUTURE_UNLOCKS.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

          <div className="anniversary-seal" aria-hidden="true">
            <span>YES</span>
          </div>

          <div className="anniversary-cat-home" aria-hidden="true">
            <span className="anniversary-home-icon"></span>
            <span className="anniversary-cat-icon"></span>
          </div>
        </article>
      </div>
    </section>
  );
});

export default AnniversaryScene;
