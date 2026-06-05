export function isHighQualityMode() {
  return new URLSearchParams(window.location.search).get("quality") === "high";
}

export function getSceneQuality() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const highQuality = isHighQualityMode();

  return {
    highQuality,
    reduceMotion,
    dpr: reduceMotion ? 0.9 : highQuality ? 1.4 : 1.05,
    fps: reduceMotion ? 18 : highQuality ? 30 : 24,
    rootMargin: highQuality ? "18% 0px 18% 0px" : "0px 0px 0px 0px",
  };
}

export function getFrameInterval(fps) {
  return 1000 / fps;
}
