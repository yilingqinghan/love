import { forwardRef, useEffect, useMemo, useState } from "react";

import {
  travelAtlasLines,
  travelGalleryPhotos,
  travelPhotos,
} from "../data/copy.js";
import { useTravelAtlas } from "../hooks/useTravelAtlas.js";

const TravelAtlasScene = forwardRef(function TravelAtlasScene(_, ref) {
  const [activePhotoId, setActivePhotoId] = useState(travelPhotos[0]?.id ?? null);
  const [capturedPhotoIds, setCapturedPhotoIds] = useState([]);
  const [isFlashing, setIsFlashing] = useState(false);

  const activePhoto = useMemo(
    () => travelPhotos.find((photo) => photo.id === activePhotoId) ?? travelPhotos[0],
    [activePhotoId]
  );

  const galleryRows = useMemo(() => {
    const wallWidths = [360, 280, 420, 300, 380, 260, 400, 320];
    const expanded = travelGalleryPhotos.map((photo, photoIndex) => ({
      ...photo,
      key: `${photo.id}-${photoIndex}`,
      wallWidth: wallWidths[photoIndex % wallWidths.length],
      wallDepth: (photoIndex % 4) * 14,
    }));
    return [
      expanded.filter((_, index) => index % 3 === 0),
      expanded.filter((_, index) => index % 3 === 1),
      expanded.filter((_, index) => index % 3 === 2),
    ];
  }, []);

  useTravelAtlas({
    sectionRef: ref,
    activePhoto,
    capturedCount: capturedPhotoIds.length,
    flashActive: isFlashing,
  });

  useEffect(() => {
    if (!isFlashing) return undefined;
    const timer = window.setTimeout(() => setIsFlashing(false), 420);
    return () => window.clearTimeout(timer);
  }, [isFlashing]);

  const handleCapture = () => {
    if (!activePhoto) return;
    setCapturedPhotoIds((current) => (current.includes(activePhoto.id) ? current : [...current, activePhoto.id]));
    setIsFlashing(true);
  };

  return (
    <section id="travel-atlas" ref={ref} className="travel-atlas-section" aria-label="探索世界与记忆">
      <div className={`travel-camera-flash${isFlashing ? " is-on" : ""}`} aria-hidden="true"></div>

      <div className="travel-atlas-backdrop" aria-hidden="true">
        <div className="travel-world-bg"></div>
        <div className="travel-glow g1"></div>
        <div className="travel-glow g2"></div>
        <div className="travel-grid"></div>
      </div>

      <div className="travel-copy">
        <p className="travel-index">05 / Exploring The World</p>
        <div className="travel-lines-viewport">
          <div className="travel-lines-track">
            {travelAtlasLines.map((line) => (
              <p className="travel-line" key={line}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="travel-atlas-stage">
        <div className="travel-world-shell" aria-hidden="true">
          <div className="travel-world">
            <div className="travel-world-globe">
              <div className="travel-world-globe-surface"></div>
              <div className="travel-world-globe-shadow"></div>
              <div className="travel-world-globe-specular"></div>
              <div className="travel-world-globe-halo"></div>
            </div>
          </div>

          <div className="travel-memory-ribbon">
            <span>choose a place / take the shot / keep the memory</span>
          </div>
        </div>

        <aside className="travel-ticket-panel" aria-label="记忆机票">
          <div className="travel-ticket-box">
            <ul className="travel-ticket-edge left" aria-hidden="true">
              {Array.from({ length: 14 }, (_, index) => (
                <li key={`left-${index}`}></li>
              ))}
            </ul>
            <ul className="travel-ticket-edge right" aria-hidden="true">
              {Array.from({ length: 14 }, (_, index) => (
                <li key={`right-${index}`}></li>
              ))}
            </ul>
            <div className="travel-ticket-card">
              <span className="travel-ticket-airline">Love Airlines</span>
              <span className="travel-ticket-airline travel-ticket-airline-slip">Love Airlines</span>
              <span className="travel-ticket-boarding">Boarding pass</span>

              <div className="travel-ticket-content">
                <span className="travel-ticket-from">SHA</span>
                <span className="travel-ticket-plane" aria-hidden="true">
                  <svg clipRule="evenodd" fillRule="evenodd" height="60" width="60" imageRendering="optimizeQuality" shapeRendering="geometricPrecision" textRendering="geometricPrecision" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                    <g stroke="#222">
                      <line fill="none" strokeLinecap="round" strokeWidth="30" x1="300" x2="55" y1="390" y2="390" />
                      <path d="M98 325c-9 10 10 16 25 6l311-156c24-17 35-25 42-50 2-15-46-11-78-7-15 1-34 10-42 16l-56 35 1-1-169-31c-14-3-24-5-37-1-10 5-18 10-27 18l122 72c4 3 5 7 1 9l-44 27-75-15c-10-2-18-4-28 0-8 4-14 9-20 15l74 63z" fill="#222" strokeLinejoin="round" strokeWidth="10" />
                    </g>
                  </svg>
                </span>
                <span className="travel-ticket-to">{activePhoto.code}</span>

                <span className="travel-ticket-from travel-ticket-from-slip">SHA</span>
                <span className="travel-ticket-plane travel-ticket-plane-slip" aria-hidden="true">
                  <svg clipRule="evenodd" fillRule="evenodd" height="50" width="50" imageRendering="optimizeQuality" shapeRendering="geometricPrecision" textRendering="geometricPrecision" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                    <g stroke="#222">
                      <line fill="none" strokeLinecap="round" strokeWidth="30" x1="300" x2="55" y1="390" y2="390" />
                      <path d="M98 325c-9 10 10 16 25 6l311-156c24-17 35-25 42-50 2-15-46-11-78-7-15 1-34 10-42 16l-56 35 1-1-169-31c-14-3-24-5-37-1-10 5-18 10-27 18l122 72c4 3 5 7 1 9l-44 27-75-15c-10-2-18-4-28 0-8 4-14 9-20 15l74 63z" fill="#222" strokeLinejoin="round" strokeWidth="10" />
                    </g>
                  </svg>
                </span>
                <span className="travel-ticket-to travel-ticket-to-slip">{activePhoto.code}</span>

                <div className="travel-ticket-subcontent">
                  <span className="travel-ticket-watermark">Love</span>
                  <span className="travel-ticket-name">
                    PASSENGER NAME
                    <br />
                    <span>Yiling Qinghan</span>
                  </span>
                  <span className="travel-ticket-flight">
                    FLIGHT N°
                    <br />
                    <span>{activePhoto.flight}</span>
                  </span>
                  <span className="travel-ticket-gate">
                    GATE
                    <br />
                    <span>{activePhoto.gate}</span>
                  </span>
                  <span className="travel-ticket-seat">
                    SEAT
                    <br />
                    <span>{activePhoto.seat}</span>
                  </span>
                  <span className="travel-ticket-boardingtime">
                    DESTINATION
                    <br />
                    <span>{activePhoto.title}</span>
                  </span>

                  <span className="travel-ticket-flight travel-ticket-flight-slip">
                    FLIGHT N°
                    <br />
                    <span>{activePhoto.flight}</span>
                  </span>
                  <span className="travel-ticket-seat travel-ticket-seat-slip">
                    SEAT
                    <br />
                    <span>{activePhoto.seat}</span>
                  </span>
                  <span className="travel-ticket-name travel-ticket-name-slip">
                    PASSENGER NAME
                    <br />
                    <span>Yiling Qinghan</span>
                  </span>
                </div>
              </div>
              <div className="travel-ticket-barcode"></div>
              <div className="travel-ticket-barcode travel-ticket-barcode-slip"></div>
            </div>
          </div>
        </aside>

        <div className="travel-camera-dock">
          <button type="button" className="travel-camera-button" onClick={handleCapture} aria-label="拍下这段记忆">
            <div className="travel-camera">
              <div className="camera-top">
                <div className="zoom"></div>
                <div className="mode-changer"></div>
                <div className="sides"></div>
                <div className="range-finder"></div>
                <div className="focus"></div>
                <div className="red"></div>
                <div className="view-finder"></div>
                <div className="flash">
                  <div className="light"></div>
                </div>
              </div>
              <div className="camera-mid">
                <div className="sensor"></div>
                <div className="lens"></div>
              </div>
              <div className="camera-bottom"></div>
            </div>
          </button>
          <p>{capturedPhotoIds.includes(activePhoto.id) ? "already kept" : "tap the shutter"}</p>
        </div>
      </div>

      <div className="travel-polaroids" aria-label="旅行照片">
        {travelPhotos.map((photo, index) => {
          const isActive = photo.id === activePhoto.id;
          const isCaptured = capturedPhotoIds.includes(photo.id);

          return (
            <button
              type="button"
              className={`travel-polaroid p${index + 1}${isActive ? " is-active" : ""}${isCaptured ? " is-captured" : ""}`}
              key={photo.id}
              onClick={() => setActivePhotoId(photo.id)}
              style={{
                "--photo-x":
                  index === 0
                    ? "54%"
                    : index === 1
                      ? "77%"
                      : index === 2
                        ? "62%"
                        : "83%",
                "--photo-y":
                  index === 0
                    ? "16%"
                    : index === 1
                      ? "26%"
                      : index === 2
                        ? "48%"
                        : "70%",
                "--photo-r": photo.rotate,
                "--photo-image": `url("${photo.image}")`,
              }}
            >
              <div className="travel-polaroid-photo"></div>
              <div className="travel-polaroid-note">
                <span>{photo.title}</span>
                <em>{photo.capture}</em>
                <p>{photo.note}</p>
              </div>
              <div className="travel-polaroid-stamp">{isCaptured ? "CHECKED IN" : "SELECT"}</div>
            </button>
          );
        })}
      </div>

      <div className="travel-gallery-panel" aria-label="记忆照片墙">
        <div className="travel-gallery-stage">
          <div className="travel-gallery-wall">
            {galleryRows.map((row, rowIndex) => (
              <div className={`travel-gallery-row r${rowIndex + 1}`} key={`row-${rowIndex}`}>
                {row.map((photo, photoIndex) => {
                  const isReflectionRow = rowIndex === galleryRows.length - 1;
                  return (
                    <div
                      className={`travel-gallery-card${isReflectionRow ? " with-reflection" : ""}`}
                      key={photo.key}
                      style={{
                        "--gallery-width": `${photo.wallWidth}px`,
                        "--gallery-depth": `${photo.wallDepth}px`,
                      }}
                    >
                      <img src={photo.image} alt={photo.title} />
                      {isReflectionRow ? (
                        <div className="travel-gallery-reflection" aria-hidden="true">
                          <img src={photo.image} alt="" />
                        </div>
                      ) : null}
                      {photoIndex % 2 === 0 && (photo.title || photo.capture) ? (
                        <div className="travel-gallery-caption">
                          <strong>{photo.title}</strong>
                          <span>{photo.capture}</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default TravelAtlasScene;
