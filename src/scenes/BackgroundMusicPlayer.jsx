import { useEffect, useMemo, useRef, useState } from "react";

import { withBase } from "../utils/paths.js";

const SONG_AUTOPLAY_DELAY_MS = 5000;
const CONFESSION_FINALE_LEAD_SECONDS = 92;
const FALLBACK_DURATION_SECONDS = 288.301361;
const MIN_SCROLL_SPEED = 150;
const MAX_SCROLL_SPEED = 1050;
const MAX_SCROLL_FRAME_DELTA_MS = 42;
const MANUAL_SCROLL_PAUSE_MS = 260;
const TARGET_REFRESH_INTERVAL_MS = 420;
const SECTION_SCROLL_FACTORS = [
  [".probability-section", 1.05],
  [".sky-route-section", 1.03],
  [".ocean-echo-section", 1],
  [".travel-atlas-section", 1.12],
  [".home-nest-section", 1.08],
  [".parallel-ascent-section", 1.18],
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getMaxScroll() {
  const documentHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight
  );
  return Math.max(0, documentHeight - window.innerHeight);
}

function getTargetScrollY(finalSceneRef) {
  const scene = finalSceneRef?.current;
  const maxScroll = getMaxScroll();

  if (!scene) {
    return maxScroll;
  }

  return clamp(scene.getBoundingClientRect().top + window.scrollY, 0, maxScroll);
}

function getStableTargetScrollY(finalSceneRef) {
  const maxScroll = getMaxScroll();
  const finalSceneY = getTargetScrollY(finalSceneRef);

  /*
    自动滚动启动时，字体、iframe、图片、WebGL 资源可能还没全部撑开页面。
    如果此时 finalScene 的位置被算得异常靠前，直接用它会误判“快到了”，导致滚动停住。
    所以这里保底使用页面后段位置，后续 tick 会持续重新计算，等布局稳定后自动追上真实终点。
  */
  const conservativeTarget = maxScroll * 0.92;
  return clamp(Math.max(finalSceneY, conservativeTarget), 0, maxScroll);
}

function getActiveSectionScrollFactor() {
  const probeX = window.innerWidth * 0.5;
  const probeY = window.innerHeight * 0.5;
  const element = document.elementFromPoint(probeX, probeY);
  const section = element?.closest?.("section");

  if (!section) {
    return 1;
  }

  const match = SECTION_SCROLL_FACTORS.find(([selector]) => section.matches(selector));
  return match?.[1] ?? 1;
}

function parseLrc(rawText) {
  return rawText
    .split(/\r?\n/)
    .flatMap((line) => {
      const matches = [...line.matchAll(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
      const text = line.replace(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g, "").trim();

      if (!matches.length || !text) {
        return [];
      }

      return matches.map((match) => {
        const minute = Number(match[1] ?? 0);
        const second = Number(match[2] ?? 0);
        const decimalRaw = match[3] ?? "0";
        const decimal =
          decimalRaw.length === 3 ? Number(decimalRaw) / 1000 : Number(decimalRaw) / 100;

        return {
          time: minute * 60 + second + decimal,
          text,
        };
      });
    })
    .sort((a, b) => a.time - b.time);
}

export default function BackgroundMusicPlayer({ finalSceneRef = null }) {
  const audioRef = useRef(null);
  const frameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const lastTargetRefreshRef = useRef(0);
  const targetYRef = useRef(0);
  const manualPauseUntilRef = useRef(0);
  const resumeHandlerRef = useRef(null);
  const autoStartedRef = useRef(false);
  const autoScrollEnabledRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [lyrics, setLyrics] = useState([]);

  useEffect(() => {
    let isMounted = true;

    fetch(withBase("/assets/music/long-confession.lrc"))
      .then((response) => response.text())
      .then((text) => {
        if (isMounted) {
          setLyrics(parseLrc(text));
        }
      })
      .catch(() => {
        if (isMounted) {
          setLyrics([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return undefined;
    }

    const syncState = () => {
      setCurrentTime(audio.currentTime || 0);
      setIsPlaying(!audio.paused);
      setIsMuted(audio.muted);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolume = () => setIsMuted(audio.muted);

    audio.addEventListener("timeupdate", syncState);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("volumechange", handleVolume);

    syncState();

    return () => {
      audio.removeEventListener("timeupdate", syncState);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("volumechange", handleVolume);
    };
  }, []);

  useEffect(() => {
    const tick = (time) => {
      const audio = audioRef.current;

      if (autoScrollEnabledRef.current && !document.hidden) {
        if (!targetYRef.current || time - lastTargetRefreshRef.current > TARGET_REFRESH_INTERVAL_MS) {
          targetYRef.current = getStableTargetScrollY(finalSceneRef);
          lastTargetRefreshRef.current = time;
        }

        const targetY = targetYRef.current;
        const distanceLeft = Math.max(0, targetY - window.scrollY);
        const duration = Number.isFinite(audio?.duration) && audio.duration > 0
          ? audio.duration
          : FALLBACK_DURATION_SECONDS;
        const currentAudioTime = audio?.currentTime || 0;
        const scrollSyncDuration = Math.max(duration - CONFESSION_FINALE_LEAD_SECONDS, 120);
        const secondsLeft = Math.max(scrollSyncDuration - currentAudioTime, 8);
        const lastFrameTime = lastFrameTimeRef.current || time;
        const frameDelta = Math.min(Math.max(time - lastFrameTime, 0), MAX_SCROLL_FRAME_DELTA_MS);
        const finalSceneTop = finalSceneRef?.current?.getBoundingClientRect?.().top ?? Infinity;
        const isTemporarilyPaused =
          document.body.classList.contains("boot-lock") || Date.now() < manualPauseUntilRef.current;

        if (!isTemporarilyPaused && distanceLeft > 2 && frameDelta > 0) {
          const baseSpeed = clamp(distanceLeft / secondsLeft, MIN_SCROLL_SPEED, MAX_SCROLL_SPEED);
          const speed = baseSpeed * getActiveSectionScrollFactor();
          const nextY = Math.min(targetY, window.scrollY + (speed * frameDelta) / 1000);
          window.scrollTo({
            top: nextY,
            left: 0,
            behavior: "auto",
          });
        }

        if (finalSceneTop <= window.innerHeight * 0.5 && distanceLeft <= 2) {
          autoScrollEnabledRef.current = false;
        }

        lastFrameTimeRef.current = time;
      } else {
        lastFrameTimeRef.current = time;
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    const refreshAutoScrollTarget = () => {
      targetYRef.current = getStableTargetScrollY(finalSceneRef);
      lastTargetRefreshRef.current = performance.now();

      if (autoStartedRef.current && !document.hidden) {
        autoScrollEnabledRef.current = true;
        manualPauseUntilRef.current = 0;
        lastFrameTimeRef.current = performance.now();
      }
    };

    window.addEventListener("love:boot-unlocked", refreshAutoScrollTarget);
    window.addEventListener("load", refreshAutoScrollTarget);
    window.addEventListener("resize", refreshAutoScrollTarget);
    document.addEventListener("visibilitychange", refreshAutoScrollTarget);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener("love:boot-unlocked", refreshAutoScrollTarget);
      window.removeEventListener("load", refreshAutoScrollTarget);
      window.removeEventListener("resize", refreshAutoScrollTarget);
      document.removeEventListener("visibilitychange", refreshAutoScrollTarget);
    };
  }, [finalSceneRef]);

  useEffect(() => {
    const pauseForManualScroll = () => {
      if (!autoStartedRef.current) {
        return;
      }

      manualPauseUntilRef.current = Date.now() + MANUAL_SCROLL_PAUSE_MS;
    };

    const pauseForManualKey = (event) => {
      const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
      if (keys.includes(event.key)) {
        pauseForManualScroll();
      }
    };

    window.addEventListener("wheel", pauseForManualScroll, { passive: true });
    window.addEventListener("touchstart", pauseForManualScroll, { passive: true });
    window.addEventListener("keydown", pauseForManualKey);

    return () => {
      window.removeEventListener("wheel", pauseForManualScroll);
      window.removeEventListener("touchstart", pauseForManualScroll);
      window.removeEventListener("keydown", pauseForManualKey);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return undefined;
    }

    const startExperience = () => {
      if (autoStartedRef.current) {
        return;
      }

      autoStartedRef.current = true;
      autoScrollEnabledRef.current = true;
      lastFrameTimeRef.current = performance.now();
      targetYRef.current = getStableTargetScrollY(finalSceneRef);
      lastTargetRefreshRef.current = performance.now();

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          audio.muted = true;
          setIsMuted(true);

          audio
            .play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {})
            .finally(() => {
              if (resumeHandlerRef.current) {
                return;
              }

              const resumeOnFirstGesture = () => {
                audio.muted = false;
                setIsMuted(false);
                autoScrollEnabledRef.current = true;
                targetYRef.current = getStableTargetScrollY(finalSceneRef);
                lastTargetRefreshRef.current = performance.now();
                audio.play().catch(() => {});

                if (resumeHandlerRef.current) {
                  window.removeEventListener("pointerdown", resumeHandlerRef.current);
                  window.removeEventListener("keydown", resumeHandlerRef.current);
                  resumeHandlerRef.current = null;
                }
              };

              resumeHandlerRef.current = resumeOnFirstGesture;
              window.addEventListener("pointerdown", resumeOnFirstGesture, { once: true });
              window.addEventListener("keydown", resumeOnFirstGesture, { once: true });
            });
        });
    };

    const timer = window.setTimeout(startExperience, SONG_AUTOPLAY_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      if (resumeHandlerRef.current) {
        window.removeEventListener("pointerdown", resumeHandlerRef.current);
        window.removeEventListener("keydown", resumeHandlerRef.current);
        resumeHandlerRef.current = null;
      }
    };
  }, []);

  const currentLyric = useMemo(() => {
    if (!lyrics.length) {
      return "";
    }

    for (let index = lyrics.length - 1; index >= 0; index -= 1) {
      if (currentTime >= lyrics[index].time) {
        return lyrics[index].text;
      }
    }

    return "";
  }, [currentTime, lyrics]);

  const handleTogglePlayback = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      autoStartedRef.current = true;
      autoScrollEnabledRef.current = true;
      lastFrameTimeRef.current = performance.now();
      targetYRef.current = getStableTargetScrollY(finalSceneRef);
      lastTargetRefreshRef.current = performance.now();
      audio.play().catch(() => {});
    } else {
      autoScrollEnabledRef.current = false;
      audio.pause();
    }
  };

  const handleToggleMute = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  return (
    <>
      <audio ref={audioRef} className="bgm-audio" preload="auto">
        <source src={withBase("/assets/music/long-confession.mp3")} type="audio/mpeg" />
      </audio>

      {!isPlaying && currentTime < 0.8 && (
        <button type="button" className="bgm-start-prompt" onClick={handleTogglePlayback}>
          <span>Click to begin</span>
          <strong>开始这段航行</strong>
        </button>
      )}

      <div className="bgm-controls" aria-label="背景音乐控制">
        <button
          type="button"
          className="bgm-control-button"
          onClick={handleTogglePlayback}
          aria-label={isPlaying ? "暂停背景音乐" : "播放背景音乐"}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="bgm-control-button"
          onClick={handleToggleMute}
          aria-label={isMuted ? "取消静音" : "静音背景音乐"}
        >
          {isMuted ? "Muted" : "Sound"}
        </button>
      </div>

      <div className="bgm-lyric" aria-live="polite">
        {currentLyric}
      </div>
    </>
  );
}
