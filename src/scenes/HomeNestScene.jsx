import { forwardRef } from "react";

import { homeAfterglowLines, homeRoomCaptions } from "../data/copy.js";
import { useHomeNest } from "../hooks/useHomeNest.js";

const HomeNestScene = forwardRef(function HomeNestScene(_, ref) {
  useHomeNest({ sectionRef: ref });

  const livingWordsSrc = "/home-words/index.html?v=homewords-fullscreen-5";
  const roomVersion = "home-rooms-family-5";

  return (
    <section id="home-nest" ref={ref} className="home-nest-section" aria-label="关于家的篇章">
      <div className="home-word-stage">
        <iframe
          title="living words"
          className="home-living-frame"
          src={livingWordsSrc}
          loading="eager"
          allow="autoplay"
          style={{ position: "absolute", inset: 0, width: "100vw", height: "100vh", border: 0, display: "block" }}
        ></iframe>
      </div>

      <div className="home-room-sequence" aria-label="家的很多房间">
        {homeRoomCaptions.map((room, index) => (
          <article
            className={`home-room-stage s${index + 1} room-${room.id}`}
            key={room.id}
            style={{
              position: "absolute",
              inset: 0,
              width: "100vw",
              height: "100vh",
            }}
          >
            <div
              className="home-room-viewport"
              style={{
                position: "absolute",
                inset: 0,
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
              }}
            >
              <iframe
                title={room.title}
                className="home-room-embed"
                src={`${room.src}?v=${roomVersion}`}
                loading="eager"
                allow="autoplay"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100vw",
                  height: "100vh",
                  border: 0,
                  display: "block",
                  background: "transparent",
                }}
              ></iframe>
            </div>
          </article>
        ))}
      </div>

      <div className="home-afterglow">
        <div className="home-afterglow-viewport">
          <div className="home-afterglow-track">
            {homeAfterglowLines.map((line) => (
              <p className="home-afterglow-line" key={line}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default HomeNestScene;
