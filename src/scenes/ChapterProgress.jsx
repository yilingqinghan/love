import { useEffect, useMemo, useState } from "react";

function getChapterScore(element) {
  const rect = element.getBoundingClientRect();
  const viewportCenter = window.innerHeight / 2;
  const elementCenter = rect.top + rect.height / 2;
  const visible = rect.bottom > 0 && rect.top < window.innerHeight;
  return Math.abs(elementCenter - viewportCenter) + (visible ? 0 : 10000);
}

export default function ChapterProgress({ chapters }) {
  const [activeId, setActiveId] = useState(chapters[0]?.id ?? "");

  const activeIndex = useMemo(() => {
    const index = chapters.findIndex((chapter) => chapter.id === activeId);
    return Math.max(0, index);
  }, [activeId, chapters]);

  useEffect(() => {
    let frameId = 0;

    const updateActiveChapter = () => {
      frameId = 0;

      const best = chapters
        .map((chapter) => ({
          ...chapter,
          element: chapter.ref.current,
        }))
        .filter((chapter) => chapter.element)
        .sort((a, b) => getChapterScore(a.element) - getChapterScore(b.element))[0];

      if (best) {
        setActiveId(best.id);
      }
    };

    const requestUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateActiveChapter);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [chapters]);

  return (
    <nav className="chapter-progress" aria-label="章节进度">
      <div className="chapter-progress-line" aria-hidden="true">
        <span
          style={{
            "--chapter-progress": chapters.length > 1 ? activeIndex / (chapters.length - 1) : 0,
          }}
        ></span>
      </div>

      <div className="chapter-progress-dots">
        {chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            type="button"
            className={`chapter-progress-dot ${chapter.id === activeId ? "is-active" : ""}`}
            onClick={() => chapter.ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            aria-label={`跳转到 ${chapter.label}`}
          >
            <span>{`${index + 1}`.padStart(2, "0")}</span>
          </button>
        ))}
      </div>

      <p className="chapter-progress-label">{chapters[activeIndex]?.label}</p>
    </nav>
  );
}
