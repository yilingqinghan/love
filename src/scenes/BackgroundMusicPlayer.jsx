import { useEffect, useMemo, useRef, useState } from "react";

import { withBase } from "../utils/paths.js";

const SONG_AUTOPLAY_DELAY_MS = 5000;
const CONFESSION_FINALE_LEAD_SECONDS = 14;

function easeScroll(progress) {
  return progress * progress * (3 - 2 * progress);
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
  const resumeHandlerRef = useRef(null);
  const animationFrameRef = useRef(0);
  const autoScrollPlanRef = useRef({
    isEnabled: false,
    startY: 0,
    targetY: 0,
    travelWindow: 0,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [lyrics, setLyrics] = useState([]);

  useEffect(() => {
    let isMounted = true;

    fetch(withBase("/assets/music/long-confession.lrc"))
      .then((response) => response.text())
      .then((text) => {
        if (!isMounted) {
          return;
        }
        setLyrics(parseLrc(text));
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
    const audio = audioRef.current;

    if (!audio) {
      return undefined;
    }

    const tryPlay = () => {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          if (resumeHandlerRef.current) {
            window.removeEventListener("pointerdown", resumeHandlerRef.current);
            window.removeEventListener("keydown", resumeHandlerRef.current);
            resumeHandlerRef.current = null;
          }
        })
        .catch(() => {
          if (resumeHandlerRef.current) {
            return;
          }

          const resumeOnFirstGesture = () => {
            audio
              .play()
              .then(() => {
                setIsPlaying(true);
              })
              .catch(() => {})
              .finally(() => {
                if (resumeHandlerRef.current) {
                  window.removeEventListener("pointerdown", resumeHandlerRef.current);
                  window.removeEventListener("keydown", resumeHandlerRef.current);
                  resumeHandlerRef.current = null;
                }
              });
          };

          resumeHandlerRef.current = resumeOnFirstGesture;
          window.addEventListener("pointerdown", resumeOnFirstGesture, { once: true });
          window.addEventListener("keydown", resumeOnFirstGesture, { once: true });
        });
    };

    const timer = window.setTimeout(tryPlay, 5000);

    return () => {
      window.clearTimeout(timer);
      if (resumeHandlerRef.current) {
        window.removeEventListener("pointerdown", resumeHandlerRef.current);
        window.removeEventListener("keydown", resumeHandlerRef.current);
        resumeHandlerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return undefined;
    }

    const updateScrollPlan = () => {
      const scene = finalSceneRef?.current;
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 288.301361;

      if (!scene) {
        autoScrollPlanRef.current = {
          isEnabled: false,
          startY: window.scrollY,
          targetY: window.scrollY,
          travelWindow: Math.max(duration - CONFESSION_FINALE_LEAD_SECONDS, 1),
        };
        return;
      }

      const sceneTop = scene.getBoundingClientRect().top + window.scrollY;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      ) - window.innerHeight;

      autoScrollPlanRef.current = {
        isEnabled: true,
        startY: window.scrollY,
        targetY: Math.max(0, Math.min(sceneTop, maxScroll)),
        travelWindow: Math.max(duration - CONFESSION_FINALE_LEAD_SECONDS, 1),
      };
    };

    const handleLoadedMetadata = () => {
      updateScrollPlan();
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handleLoadedMetadata);
    updateScrollPlan();
    window.addEventListener("resize", updateScrollPlan);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handleLoadedMetadata);
      window.removeEventListener("resize", updateScrollPlan);
    };
  }, [finalSceneRef]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return undefined;
    }

    const tickAutoScroll = () => {
      const plan = autoScrollPlanRef.current;

      if (plan.isEnabled && !audio.paused) {
        const progress = Math.min((audio.currentTime || 0) / plan.travelWindow, 1);
        const eased = easeScroll(progress);
        const nextY = plan.startY + (plan.targetY - plan.startY) * eased;
        window.scrollTo({ top: nextY, behavior: "auto" });
      }

      animationFrameRef.current = window.requestAnimationFrame(tickAutoScroll);
    };

    animationFrameRef.current = window.requestAnimationFrame(tickAutoScroll);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
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
      if (!autoScrollPlanRef.current.isEnabled) {
        autoScrollPlanRef.current.startY = window.scrollY;
      }
      audio.play().catch(() => {});
    } else {
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
