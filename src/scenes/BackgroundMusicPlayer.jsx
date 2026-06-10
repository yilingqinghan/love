import { useEffect, useMemo, useRef, useState } from "react";

import { withBase } from "../utils/paths.js";

const SONG_AUTOPLAY_DELAY_MS = 5000;
const CONFESSION_FINALE_LEAD_SECONDS = 14;
const FALLBACK_DURATION_SECONDS = 288.301361;
const MIN_SCROLL_SPEED = 42;
const MAX_SCROLL_SPEED = 190;
const MANUAL_SCROLL_PAUSE_MS = 1800;

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
        const lastFrameTime = lastFrameTimeRef.current || time;
        const delta = Math.min(64, time - lastFrameTime);
        const targetY = getTargetScrollY(finalSceneRef);
        const distanceLeft = Math.max(0, targetY - window.scrollY);
        const duration = Number.isFinite(audio?.duration) && audio.duration > 0
          ? audio.duration
          : FALLBACK_DURATION_SECONDS;
        const currentAudioTime = audio?.currentTime || 0;
        const secondsLeft = Math.max(duration - CONFESSION_FINALE_LEAD_SECONDS - currentAudioTime, 18);

        if (
          !document.body.classList.contains("boot-lock") &&
          Date.now() >= manualPauseUntilRef.current &&
          distanceLeft > 2
        ) {
          const speed = clamp(distanceLeft / secondsLeft, MIN_SCROLL_SPEED, MAX_SCROLL_SPEED);
          window.scrollBy({
            top: (speed * delta) / 1000,
            left: 0,
            behavior: "auto",
          });
        }

        if (distanceLeft <= 2) {
          autoScrollEnabledRef.current = false;
        }

        lastFrameTimeRef.current = time;
      } else {
        lastFrameTimeRef.current = time;
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
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
