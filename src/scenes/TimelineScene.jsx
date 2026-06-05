import { forwardRef } from "react";

const TimelineScene = forwardRef(function TimelineScene({ items }, ref) {
  return (
    <section ref={ref} className="timeline-section" aria-label="三天时间轴">
      <div className="timeline-bg" aria-hidden="true"></div>
      <div className="timeline-inner">
        <p className="section-label">Three days, one quiet proof</p>
        <div className="timeline-line" aria-hidden="true"></div>
        <div className="timeline-list">
          {items.map((item) => (
            <article className={`timeline-item ${item.align}`} key={item.day}>
              <span className="timeline-dot" aria-hidden="true"></span>
              <span className="timeline-day">{item.day}</span>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
});

export default TimelineScene;
