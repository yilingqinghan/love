/*
  全站节奏总配置
  ------------------------------------------------------------
  之后想调“自动滚动快慢 / 每一幕动画跟手程度 / 卡顿感”，优先改这里。

  1. AUTO_SCROLL_TIMING：控制页面自己往下滚的速度。
  2. SCENE_TIMING：控制各个 ScrollTrigger pin 住的章节走多长、scrub 多黏。

  调参直觉：
  - autoScroll.minSpeedPxPerSecond / maxSpeedPxPerSecond 越大，整页自动滚越快。
  - autoScroll.maxFrameDeltaMs 越小，滚动步进越细，视觉更稳，但可能更慢一点。
  - scene.distanceMultiplier 越小，每个 pinned 章节越快放完。
  - scene.scrubMultiplier 越小，动画越跟手；太大就会出现“文字走完，动画还慢”的感觉。
*/

export const AUTO_SCROLL_TIMING = {
  autoplayDelayMs: 2500,
  confessionFinaleLeadSeconds: 115,
  fallbackSongDurationSeconds: 288.301361,
  minSpeedPxPerSecond: 720,
  maxSpeedPxPerSecond: 1850,
  maxFrameDeltaMs: 28,
  manualScrollPauseMs: 160,
  targetRefreshIntervalMs: 260,
  sectionSpeedFactors: [
    [".probability-section", 1.18],
    [".sky-route-section", 1.18],
    [".ocean-echo-section", 1.15],
    [".travel-atlas-section", 1.24],
    [".home-nest-section", 1.18],
    [".food-feast-section", 1.2],
    [".parallel-ascent-section", 1.32],
  ],
};

export const SCENE_TIMING = {
  distanceMultiplier: 0.68,
  scrubMultiplier: 0.42,
  minScrub: 0.18,
  distances: {
    signalSearch: 6000,
    probability: 13200,
    skyRoute: 8400,
    oceanEcho: 9400,
    travelAtlas: 7600,
    homeNest: 6200,
    foodFeast: 4800,
    worldMerge: 1500,
    parallelAscent: 4700,
  },
};

export function sceneDistance(key) {
  const baseDistance = SCENE_TIMING.distances[key];
  return Math.round(baseDistance * SCENE_TIMING.distanceMultiplier);
}

export function sceneScrub(value = 1) {
  return Math.max(SCENE_TIMING.minScrub, Number((value * SCENE_TIMING.scrubMultiplier).toFixed(3)));
}
