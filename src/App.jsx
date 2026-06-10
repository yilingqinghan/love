import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

import AnniversaryScene from "./scenes/AnniversaryScene.jsx";
import BackgroundMusicPlayer from "./scenes/BackgroundMusicPlayer.jsx";
import BootSequence from "./scenes/BootSequence.jsx";
import ConfessionScene from "./scenes/ConfessionScene.jsx";
import FoodFeastScene from "./scenes/FoodFeastScene.jsx";
import HeroScene from "./scenes/HeroScene.jsx";
import HomeNestScene from "./scenes/HomeNestScene.jsx";
import OceanEchoScene from "./scenes/OceanEchoScene.jsx";
import ParallelAscentScene from "./scenes/ParallelAscentScene.jsx";
import ProbabilityScene from "./scenes/ProbabilityScene.jsx";
import SkyRouteScene from "./scenes/SkyRouteScene.jsx";
import TravelAtlasScene from "./scenes/TravelAtlasScene.jsx";
import { withBase } from "./utils/paths.js";
import {
  bootMessages,
  oceanEchoLines,
  oceanEchoes,
  oceanCinemaLines,
  oceanPoems,
  probabilityRows,
  skyRouteLines,
  typeCodes,
  zodiacSigns,
} from "./data/copy.js";
import { useSceneAnimations } from "./hooks/useSceneAnimations.js";

export default function App() {
  const anniversaryStorageKey = "love-you-anniversary-start";
  const bootRef = useRef(null);
  const heroRef = useRef(null);
  const probabilityRef = useRef(null);
  const skyRouteRef = useRef(null);
  const oceanEchoRef = useRef(null);
  const travelRef = useRef(null);
  const homeRef = useRef(null);
  const foodRef = useRef(null);
  const ascentRef = useRef(null);
  const confessionRef = useRef(null);
  const anniversaryRef = useRef(null);

  const [bootLines, setBootLines] = useState([]);
  const [anniversaryStart, setAnniversaryStart] = useState(null);
  const [anniversaryUnlocked, setAnniversaryUnlocked] = useState(false);

  const sceneRefs = useMemo(
    () => ({
      bootRef,
      heroRef,
    }),
    []
  );

  useSceneAnimations({
    refs: sceneRefs,
    bootMessages,
    setBootLines,
  });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(anniversaryStorageKey);
      if (stored) {
        setAnniversaryStart(stored);
      }
    } catch {
      // ignore storage read issues
    }
  }, []);

  const handleAcceptConfession = useCallback(() => {
    const fallback = new Date().toISOString();
    let startDate = fallback;

    try {
      const stored = window.localStorage.getItem(anniversaryStorageKey);
      if (stored) {
        startDate = stored;
      } else {
        window.localStorage.setItem(anniversaryStorageKey, fallback);
      }
    } catch {
      startDate = fallback;
    }

    setAnniversaryStart(startDate);
    setAnniversaryUnlocked(true);

    window.setTimeout(() => {
      anniversaryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 240);
  }, []);

  return (
    <main
      className="site-shell"
      style={{
        "--hero-image": `url("${withBase("/assets/hero-bg.jpg")}")`,
        "--timeline-image": `url("${withBase("/assets/timeline-bg.jpg")}")`,
        "--paper-texture": `url("${withBase("/assets/paper-texture.jpg")}")`,
      }}
    >
      <BackgroundMusicPlayer finalSceneRef={confessionRef} />
      <HeroScene ref={heroRef} />
      <ProbabilityScene
        ref={probabilityRef}
        typeCodes={typeCodes}
        zodiacSigns={zodiacSigns}
        probabilityRows={probabilityRows}
      />
      <SkyRouteScene ref={skyRouteRef} lines={skyRouteLines} />
      <OceanEchoScene
        ref={oceanEchoRef}
        lines={oceanEchoLines}
        echoes={oceanEchoes}
        poems={oceanPoems}
        cinemaLines={oceanCinemaLines}
      />
      <TravelAtlasScene ref={travelRef} />
      <HomeNestScene ref={homeRef} />
      <FoodFeastScene ref={foodRef} />
      <ParallelAscentScene ref={ascentRef} />
      <ConfessionScene ref={confessionRef} onAccept={handleAcceptConfession} />
      {anniversaryUnlocked && <AnniversaryScene ref={anniversaryRef} startDate={anniversaryStart} />}
      <BootSequence ref={bootRef} lines={bootLines} />
    </main>
  );
}
