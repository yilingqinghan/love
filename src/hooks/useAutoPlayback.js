import { useCallback, useEffect, useRef, useState } from "react";

const TARGET_DURATION_MS = 285000;
const MIN_SPEED = 52;
const MAX_SPEED = 128;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getMaxScroll() {
  const doc = document.documentElement;
  return Math.max(0, doc.scrollHeight - window.innerHeight);
}

export function useAutoPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const isPlayingRef = useRef(false);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    window.cancelAnimationFrame(frameRef.current);
  }, []);

  const tick = useCallback(
    (time) => {
      if (!isPlayingRef.current) return;

      if (document.body.classList.contains("boot-lock") || document.hidden) {
        lastTimeRef.current = time;
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const maxScroll = getMaxScroll();
      const delta = Math.min(64, time - (lastTimeRef.current || time));
      const speed = clamp(maxScroll / (TARGET_DURATION_MS / 1000), MIN_SPEED, MAX_SPEED);
      const nextY = Math.min(maxScroll, window.scrollY + (speed * delta) / 1000);

      window.scrollTo({ top: nextY, behavior: "auto" });
      lastTimeRef.current = time;

      if (nextY >= maxScroll - 2) {
        stop();
        return;
      }

      frameRef.current = window.requestAnimationFrame(tick);
    },
    [stop]
  );

  const play = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setHasStarted(true);
    setIsPlaying(true);
    isPlayingRef.current = true;
    lastTimeRef.current = performance.now();
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(tick);
  }, [tick]);

  const replay = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(play, 420);
  }, [play]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("auto")) return undefined;

    const timer = window.setInterval(() => {
      if (!document.body.classList.contains("boot-lock")) {
        window.clearInterval(timer);
        play();
      }
    }, 240);

    return () => window.clearInterval(timer);
  }, [play]);

  useEffect(() => {
    const pauseForManualControl = (event) => {
      if (!isPlayingRef.current) return;
      if (event.target?.closest?.(".autoplay-controls")) return;
      stop();
    };

    const pauseForManualKey = (event) => {
      const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
      if (keys.includes(event.key)) pauseForManualControl(event);
    };

    window.addEventListener("wheel", pauseForManualControl, { passive: true });
    window.addEventListener("touchstart", pauseForManualControl, { passive: true });
    window.addEventListener("keydown", pauseForManualKey);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("wheel", pauseForManualControl);
      window.removeEventListener("touchstart", pauseForManualControl);
      window.removeEventListener("keydown", pauseForManualKey);
    };
  }, [stop]);

  return {
    hasStarted,
    isPlaying,
    play,
    replay,
    stop,
  };
}
