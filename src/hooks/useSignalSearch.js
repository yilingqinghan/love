import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

import { sceneDistance, sceneScrub } from "../config/timing.js";
import { getFrameInterval, getSceneQuality } from "../utils/performance.js";

gsap.registerPlugin(ScrollTrigger);

function randomSpherePoint(radius, depthShift = 0) {
  const r = radius * (0.35 + Math.random() * 0.65);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi) - depthShift,
  };
}

function createStarLayer({ count, radius, depthShift, size, color, opacity }) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const baseColor = new THREE.Color(color);

  for (let i = 0; i < count; i += 1) {
    const point = randomSpherePoint(radius, depthShift);
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;

    const tint = baseColor.clone().lerp(new THREE.Color("#ffffff"), Math.random() * 0.28);
    colors[i * 3] = tint.r;
    colors[i * 3 + 1] = tint.g;
    colors[i * 3 + 2] = tint.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geometry, material);
}

function createHaloTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255, 246, 214, 0.96)");
  gradient.addColorStop(0.18, "rgba(232, 211, 160, 0.54)");
  gradient.addColorStop(0.46, "rgba(156, 244, 222, 0.16)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function createFogTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255, 241, 205, 0.22)");
  gradient.addColorStop(0.28, "rgba(168, 255, 232, 0.1)");
  gradient.addColorStop(0.58, "rgba(92, 128, 126, 0.045)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 120; i += 1) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 8 + Math.random() * 34;
    const alpha = Math.random() * 0.04;
    context.beginPath();
    context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createFogGroup(texture, count = 34) {
  const group = new THREE.Group();
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: "#d8fff0",
    transparent: true,
    opacity: 0.07,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  for (let i = 0; i < count; i += 1) {
    const sprite = new THREE.Sprite(material);
    sprite.position.set(
      (Math.random() - 0.5) * 56,
      (Math.random() - 0.5) * 28,
      -18 - Math.random() * 76
    );
    const scale = 8 + Math.random() * 28;
    sprite.scale.set(scale * (1.2 + Math.random()), scale, 1);
    sprite.rotation.z = Math.random() * Math.PI;
    group.add(sprite);
  }

  return { group, material };
}

function createConstellation(targetPosition) {
  const points = [
    new THREE.Vector3(-1.2, 0.42, 0),
    new THREE.Vector3(-0.32, 1.06, 0.08),
    new THREE.Vector3(0.26, 0.22, -0.04),
    new THREE.Vector3(1.18, 0.72, 0.02),
    new THREE.Vector3(0.76, -0.54, 0.1),
    new THREE.Vector3(-0.42, -0.64, -0.02),
  ].map((point) => point.add(targetPosition));

  const lineVertices = [
    points[0],
    points[1],
    points[1],
    points[2],
    points[2],
    points[3],
    points[2],
    points[4],
    points[4],
    points[5],
    points[5],
    points[0],
  ];

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(lineVertices);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: "#f7ead3",
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);

  const nodeGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const nodeMaterial = new THREE.PointsMaterial({
    color: "#fff2d2",
    size: 0.095,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const nodes = new THREE.Points(nodeGeometry, nodeMaterial);

  return { lines, nodes, lineMaterial, nodeMaterial };
}

export function useSignalSearch({ sectionRef, canvasRef }) {
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return undefined;

    const quality = getSceneQuality();
    const reduceMotion = quality.reduceMotion;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: quality.highQuality,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.dpr));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#050607", 0.018);

    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 180);
    camera.position.set(0, 0.4, 68);

    const starGroup = new THREE.Group();
    scene.add(starGroup);

    const farStars = createStarLayer({
      count: reduceMotion ? 420 : quality.highQuality ? 1800 : 860,
      radius: 96,
      depthShift: 22,
      size: 0.055,
      color: "#cfe7ff",
      opacity: 0.42,
    });
    const midStars = createStarLayer({
      count: reduceMotion ? 260 : quality.highQuality ? 980 : 420,
      radius: 70,
      depthShift: 10,
      size: 0.085,
      color: "#e8f9ff",
      opacity: 0.36,
    });
    const nearStars = createStarLayer({
      count: reduceMotion ? 80 : quality.highQuality ? 340 : 140,
      radius: 48,
      depthShift: -4,
      size: 0.14,
      color: "#fff4de",
      opacity: 0.12,
    });
    starGroup.add(farStars, midStars, nearStars);

    const fogTexture = createFogTexture();
    const fogLayer = createFogGroup(fogTexture, reduceMotion ? 10 : quality.highQuality ? 34 : 16);
    scene.add(fogLayer.group);

    const targetPosition = new THREE.Vector3(7.4, 2.7, -9.5);
    const target = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 24, 24),
      new THREE.MeshBasicMaterial({
        color: "#ffe4a6",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      })
    );
    target.position.copy(targetPosition);
    scene.add(target);

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createHaloTexture(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    halo.position.copy(targetPosition);
    halo.scale.set(5.2, 5.2, 1);
    scene.add(halo);

    const { lines, nodes, lineMaterial, nodeMaterial } = createConstellation(targetPosition);
    scene.add(lines, nodes);

    const scanRing = new THREE.Mesh(
      new THREE.RingGeometry(1.7, 1.72, 96),
      new THREE.MeshBasicMaterial({
        color: "#c7fff0",
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
    );
    scanRing.position.copy(targetPosition);
    scanRing.scale.set(1.2, 1.2, 1);
    scene.add(scanRing);

    const mouse = { x: 0, y: 0 };
    const onPointerMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointerMove);

    const setSize = () => {
      const width = section.clientWidth || window.innerWidth;
      const height = section.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    setSize();
    window.addEventListener("resize", setSize);

    gsap.set(section.querySelectorAll(".signal-stage, .candidate-card, .signal-tag"), {
      autoAlpha: 0,
      y: 18,
    });
    gsap.set(section.querySelector(".stage-1"), { autoAlpha: 1, y: 0 });
    gsap.set(section.querySelectorAll(".signal-copy, .signal-axis, .signal-status"), {
      autoAlpha: 0.82,
    });

    /*
      Signal Search 主时间线
      ------------------------------------------------------------
      这一幕采用 pin + scrub：用户滚动时画面保持在同一屏，滚动距离映射到搜索进度。
      end 的数值越大，这一幕停留越久；现在是 6000px，保留搜索感但不拖沓。

      三维层面：
      - camera.position 从 z=68 推进到 z=16，制造穿越星场的空间感。
      - 目标信号 target / halo / constellation 逐步出现。
      - 星层 opacity 和 rotation 改变，像观测仪器不断调整焦距。

      DOM 层面：
      - stage 文案、错误候选卡片、CAFA/法典/梦境标签按阶段出现。
      - reticle 和 status 只做微弱变化，不抢 3D 主体。
    */
    const signalTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${sceneDistance("signalSearch")}`,
        pin: true,
        scrub: sceneScrub(1.25),
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    signalTl
      .to(camera.position, { z: 48, y: 0.8, duration: 0.18, ease: "none" }, 0)
      .to(farStars.material, { opacity: 0.62, duration: 0.2, ease: "none" }, 0)
      .to(fogLayer.material, { opacity: 0.12, duration: 0.24, ease: "none" }, 0.08)
      .to(".signal-copy", { y: -24, autoAlpha: 0.5, duration: 0.18 }, 0.04)
      .to(".stage-1", { autoAlpha: 0, y: -14, duration: 0.12 }, 0.14)
      .to(".stage-2", { autoAlpha: 1, y: 0, duration: 0.12 }, 0.18)
      .to(".candidate-card", { autoAlpha: 1, y: 0, stagger: 0.055, duration: 0.2 }, 0.21)
      .to(midStars.material, { opacity: 0.58, duration: 0.26, ease: "none" }, 0.2)
      .to(camera.position, { z: 34, x: 1.1, y: 1.15, duration: 0.24, ease: "none" }, 0.24)
      .to(".signal-copy", { autoAlpha: 0.22, duration: 0.18 }, 0.36)
      .to(".candidate-card", { autoAlpha: 0.18, y: -10, stagger: 0.035, duration: 0.16 }, 0.42)
      .to(".stage-2", { autoAlpha: 0, y: -14, duration: 0.1 }, 0.43)
      .to(".stage-3", { autoAlpha: 1, y: 0, duration: 0.16 }, 0.47)
      .to(target.material, { opacity: 1, duration: 0.18, ease: "power3.out" }, 0.48)
      .to(halo.material, { opacity: 0.62, duration: 0.22, ease: "power3.out" }, 0.5)
      .to(".signal-tag", { autoAlpha: 1, y: 0, stagger: 0.055, duration: 0.18 }, 0.52)
      .to(scanRing.material, { opacity: 0.42, duration: 0.16 }, 0.54)
      .to(scanRing.scale, { x: 3.1, y: 3.1, duration: 0.28, ease: "power3.out" }, 0.54)
      .to(camera.position, { z: 24, x: 2.7, y: 1.72, duration: 0.24, ease: "none" }, 0.58)
      .to(nearStars.material, { opacity: 0.42, duration: 0.24, ease: "none" }, 0.6)
      .to(".stage-3", { autoAlpha: 0, y: -14, duration: 0.08 }, 0.66)
      .to(".stage-4", { autoAlpha: 1, y: 0, duration: 0.18 }, 0.72)
      .to(lineMaterial, { opacity: 0.86, duration: 0.24, ease: "power3.out" }, 0.76)
      .to(nodeMaterial, { opacity: 0.95, duration: 0.2, ease: "power3.out" }, 0.78)
      .to(halo.scale, { x: 7.4, y: 7.4, duration: 0.22, ease: "power3.out" }, 0.8)
      .to(scanRing.material, { opacity: 0, duration: 0.12 }, 0.84)
      .to(camera.position, { z: 16, x: 4.2, y: 2.15, duration: 0.2, ease: "none" }, 0.82)
      .to(".signal-status", { autoAlpha: 0.28, duration: 0.12 }, 0.88);

    let frameId = 0;
    let shouldRender = false;
    let lastRenderTime = 0;
    const minFrameMs = getFrameInterval(quality.fps);
    const clock = new THREE.Clock();
    const render = () => {
      if (!shouldRender) return;

      const now = performance.now();
      if (now - lastRenderTime < minFrameMs) {
        frameId = window.requestAnimationFrame(render);
        return;
      }
      lastRenderTime = now;

      const elapsed = clock.getElapsedTime();

      starGroup.rotation.y += 0.00046;
      starGroup.rotation.x = Math.sin(elapsed * 0.08) * 0.018 + mouse.y * 0.018;
      starGroup.rotation.z = mouse.x * 0.012;
      fogLayer.group.rotation.z = Math.sin(elapsed * 0.035) * 0.05;
      fogLayer.group.position.x = Math.sin(elapsed * 0.08) * 0.7 + mouse.x * 0.22;
      fogLayer.group.position.y = Math.cos(elapsed * 0.07) * 0.35 - mouse.y * 0.18;

      target.scale.setScalar(1 + Math.sin(elapsed * 2.6) * 0.08);
      scanRing.rotation.z = elapsed * 0.55;

      const lookX = targetPosition.x * 0.18 + mouse.x * 0.42;
      const lookY = targetPosition.y * 0.16 - mouse.y * 0.32;
      camera.lookAt(lookX, lookY, -10);
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };

    const startRender = () => {
      if (shouldRender || document.hidden) return;
      shouldRender = true;
      lastRenderTime = 0;
      clock.start();
      render();
    };

    const stopRender = () => {
      shouldRender = false;
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    };

    /*
      性能门控：
      ------------------------------------------------------------
      搜索星场只在接近/进入本幕时跑 RAF。
      其他时候暂停，避免和前后几个 WebGL 场景一起抢 GPU。
    */
    const renderObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startRender();
        else stopRender();
      },
      { rootMargin: quality.rootMargin, threshold: 0 }
    );
    renderObserver.observe(section);

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopRender();
        return;
      }

      const rect = section.getBoundingClientRect();
      const margin = quality.highQuality ? window.innerHeight * 0.6 : 0;
      if (rect.bottom >= -margin && rect.top <= window.innerHeight + margin) {
        startRender();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopRender();
      renderObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", setSize);
      signalTl.scrollTrigger?.kill();
      signalTl.kill();
      renderer.dispose();
      farStars.geometry.dispose();
      farStars.material.dispose();
      midStars.geometry.dispose();
      midStars.material.dispose();
      nearStars.geometry.dispose();
      nearStars.material.dispose();
      target.geometry.dispose();
      target.material.dispose();
      halo.material.map.dispose();
      halo.material.dispose();
      fogTexture.dispose();
      fogLayer.material.dispose();
      lines.geometry.dispose();
      lineMaterial.dispose();
      nodes.geometry.dispose();
      nodeMaterial.dispose();
      scanRing.geometry.dispose();
      scanRing.material.dispose();
    };
  }, [canvasRef, sectionRef]);
}
