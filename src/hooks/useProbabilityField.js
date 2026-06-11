import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

import { sceneDistance, sceneScrub } from "../config/timing.js";
import { getFrameInterval, getSceneQuality } from "../utils/performance.js";

gsap.registerPlugin(ScrollTrigger);

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uPointer;
  varying vec2 vUv;

  vec2 rotate(vec2 uv, float th) {
    return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
  }

  // 改写自 neuro-noise-glsl-shader 的核心思路：
  // 通过多层旋转正弦场制造“神经星云”的纤维感，比普通噪声更像活的深空纹理。
  float neuroShape(vec2 uv, float t, float pointerPower) {
    vec2 sineAcc = vec2(0.0);
    vec2 result = vec2(0.0);
    float scale = 7.2;

    for (int j = 0; j < 15; j++) {
      uv = rotate(uv, 1.0);
      sineAcc = rotate(sineAcc, 1.0);
      vec2 layer = uv * scale + float(j) + sineAcc - t;
      sineAcc += sin(layer) + 2.15 * pointerPower;
      result += (0.5 + 0.5 * cos(layer)) / scale;
      scale *= 1.2;
    }

    return result.x + result.y;
  }

  void main() {
    vec2 p = vUv;
    vec2 center = p - 0.5;
    vec2 neuralUv = center;
    neuralUv.x *= 1.6;
    float r = length(center);
    vec2 pointer = p - uPointer;
    pointer.x *= 1.6;
    float pointerGlow = 0.5 * pow(1.0 - clamp(length(pointer), 0.0, 1.0), 2.0);
    float nerve = neuroShape(neuralUv * (1.15 + uProgress * 0.8), uTime * 0.15, pointerGlow);
    nerve = 1.35 * pow(nerve, 3.0) + pow(nerve, 9.0);
    nerve = max(0.0, nerve - 0.22);
    nerve *= 1.0 - smoothstep(0.46, 0.86, r);
    float orbit = smoothstep(0.38, 0.34, abs(r - 0.26 - uProgress * 0.05));
    float core = 1.0 - smoothstep(0.0, 0.44, r);
    float edge = smoothstep(0.0, 0.18, p.x) * smoothstep(1.0, 0.82, p.x) *
      smoothstep(0.0, 0.18, p.y) * smoothstep(1.0, 0.82, p.y);
    vec3 deep = vec3(0.035, 0.055, 0.052);
    vec3 teal = vec3(0.34, 1.0, 0.84);
    vec3 amber = vec3(1.0, 0.72, 0.34);
    vec3 rose = vec3(1.0, 0.38, 0.42);
    vec3 color = deep
      + teal * nerve * (0.28 + uProgress * 0.34)
      + amber * (orbit * 0.36 + core * 0.08 + pointerGlow * 0.18)
      + rose * nerve * uProgress * 0.08;
    color = min(color, vec3(0.68));
    float alpha = 0.025 + core * 0.07 + nerve * 0.13 + orbit * 0.1;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.32) * edge);
  }
`;

function createNodeField({ nodeCount = 92 }) {
  const nodes = [];
  const colors = [];
  const linePoints = [];
  const lineColors = [];
  const edges = [];
  const palette = [
    new THREE.Color("#d8fff0"),
    new THREE.Color("#ffe8b6"),
    new THREE.Color("#ff9d7b"),
    new THREE.Color("#c9b8ff"),
  ];
  const baseZ = -25;

  const addNode = (position, colorIndex = 0) => {
    const color = palette[colorIndex % palette.length];
    nodes.push(position);
    colors.push(color.r, color.g, color.b);
    return position;
  };

  const addEdge = (a, b, colorIndex = 0) => {
    const color = palette[colorIndex % palette.length];
    linePoints.push(a, b);
    lineColors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    edges.push([a, b]);
  };

  const root = addNode(new THREE.Vector3(0, 0, baseZ), 1);
  const primaryAxes = 6;
  const nodesPerAxis = 8;
  const axisLength = 18;
  const axisNodes = [];

  // 改写 interactive-neural-network-viz 的 quantum cortex 结构：
  // 中心根节点 + 六条放射轴 + 多层环形连接，视觉上比随机散点更像真实 3D 网络。
  for (let axis = 0; axis < primaryAxes; axis += 1) {
    const phi = Math.acos(-1 + (2 * axis) / primaryAxes);
    const theta = Math.PI * (1 + Math.sqrt(5)) * axis;
    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    );

    let previous = root;
    for (let i = 1; i <= nodesPerAxis; i += 1) {
      const t = i / nodesPerAxis;
      const distance = axisLength * Math.pow(t, 0.82);
      const position = addNode(
        new THREE.Vector3(dir.x * distance, dir.y * distance * 0.72, baseZ + dir.z * distance * 0.6),
        axis % palette.length
      );
      addEdge(previous, position, axis % palette.length);
      axisNodes.push(position);
      previous = position;
    }
  }

  const ringDistances = [5.8, 10.2, 14.8];
  const ringLayers = ringDistances.map((distance, layerIndex) => {
    const ringCount = Math.min(
      Math.floor(distance * (2.7 + layerIndex * 0.42)),
      Math.max(14, Math.floor(nodeCount / 2))
    );
    const ring = [];

    for (let i = 0; i < ringCount; i += 1) {
      const t = i / ringCount;
      const theta = t * Math.PI * 2;
      const wobble = Math.sin(theta * 3 + layerIndex) * 1.2;
      const position = addNode(
        new THREE.Vector3(
          Math.cos(theta) * (distance + wobble),
          Math.sin(theta) * (distance * 0.48 + wobble * 0.2),
          baseZ + Math.sin(theta * 2 + layerIndex) * 4.2 - layerIndex * 3.2
        ),
        layerIndex + 1
      );
      ring.push(position);
    }

    ring.forEach((node, index) => {
      addEdge(node, ring[(index + 1) % ring.length], layerIndex + 1);
      if (index % 5 === 0) {
        addEdge(node, axisNodes[(index * 3 + layerIndex) % axisNodes.length], layerIndex + 2);
      }
    });

    return ring;
  });

  for (let layer = 0; layer < ringLayers.length - 1; layer += 1) {
    const inner = ringLayers[layer];
    const outer = ringLayers[layer + 1];
    inner.forEach((node, index) => {
      if (index % 2 === 0) {
        addEdge(node, outer[(index * 2 + layer) % outer.length], layer + 2);
      }
    });
  }

  const pointGeometry = new THREE.BufferGeometry().setFromPoints(nodes);
  pointGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const pointMaterial = new THREE.PointsMaterial({
    size: 0.2,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pointGeometry, pointMaterial);

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
  lineGeometry.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);

  const pulses = createConnectionPulses(edges);

  return {
    points,
    lines,
    pointMaterial,
    lineMaterial,
    pointGeometry,
    lineGeometry,
    pulses,
  };
}

function createConnectionPulses(edges, pulseCount = 46) {
  const fallbackEdge = [new THREE.Vector3(-4, 0, -24), new THREE.Vector3(4, 0, -24)];
  const sourceEdges = edges.length > 0 ? edges : [fallbackEdge];
  const positions = new Float32Array(pulseCount * 3);
  const meta = Array.from({ length: pulseCount }, () => ({
    edgeIndex: Math.floor(Math.random() * sourceEdges.length),
    offset: Math.random(),
    speed: 0.08 + Math.random() * 0.18,
  }));

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: "#ffe8b6",
    size: 0.34,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  return { points, geometry, material, positions, meta, edges: sourceEdges };
}

function updateConnectionPulses(pulses, elapsed) {
  pulses.meta.forEach((pulse, index) => {
    const [start, end] = pulses.edges[pulse.edgeIndex];
    const raw = (elapsed * pulse.speed + pulse.offset) % 1;
    const t = raw * raw * (3 - 2 * raw);
    const i = index * 3;

    pulses.positions[i] = start.x + (end.x - start.x) * t;
    pulses.positions[i + 1] = start.y + (end.y - start.y) * t;
    pulses.positions[i + 2] = start.z + (end.z - start.z) * t + Math.sin(t * Math.PI) * 0.36;
  });

  pulses.geometry.attributes.position.needsUpdate = true;
}

function createStarField({ count = 5200 } = {}) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cool = new THREE.Color("#dff8ff");
  const warm = new THREE.Color("#fff1cc");
  const teal = new THREE.Color("#baffed");

  for (let i = 0; i < count; i += 1) {
    const radius = 36 + Math.random() * 122;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    const index = i * 3;
    const starColor = cool
      .clone()
      .lerp(Math.random() > 0.55 ? warm : teal, Math.random() * 0.62)
      .lerp(new THREE.Color("#ffffff"), Math.random() * 0.24);

    positions[index] = Math.sin(phi) * Math.cos(theta) * radius;
    positions[index + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.66;
    positions[index + 2] = -34 + Math.cos(phi) * radius * 0.42 - Math.random() * 96;
    colors[index] = starColor.r;
    colors[index + 1] = starColor.g;
    colors[index + 2] = starColor.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.13,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { points: new THREE.Points(geometry, material), geometry, material };
}

function createFogTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

  gradient.addColorStop(0, "rgba(255, 248, 222, 0.34)");
  gradient.addColorStop(0.28, "rgba(199, 255, 240, 0.16)");
  gradient.addColorStop(0.6, "rgba(255, 142, 108, 0.045)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 180; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 4 + Math.random() * 28;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.006 + Math.random() * 0.018})`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createFogLayer({ count = 44 } = {}) {
  const texture = createFogTexture();
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: "#bfffee",
    transparent: true,
    opacity: 0.018,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const group = new THREE.Group();
  for (let i = 0; i < count; i += 1) {
    const sprite = new THREE.Sprite(material);
    const scale = 10 + Math.random() * 34;

    sprite.position.set(
      (Math.random() - 0.5) * 104,
      (Math.random() - 0.5) * 58,
      -18 - Math.random() * 108
    );
    sprite.scale.set(scale * (1.35 + Math.random()), scale, 1);
    sprite.material.rotation = Math.random() * Math.PI;
    group.add(sprite);
  }

  return { group, material, texture };
}

function createPulseRings() {
  const group = new THREE.Group();
  const warmMaterial = new THREE.MeshBasicMaterial({
    color: "#ffe8b6",
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const coolMaterial = new THREE.MeshBasicMaterial({
    color: "#c7fff0",
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const warm = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.018, 8, 180), warmMaterial);
  const cool = new THREE.Mesh(new THREE.TorusGeometry(11.2, 0.014, 8, 180), coolMaterial);

  warm.position.z = -26;
  cool.position.z = -34;
  group.add(warm, cool);

  return { group, warm, cool, warmMaterial, coolMaterial };
}

export function useProbabilityField({ sectionRef, canvasRef }) {
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return undefined;

    const quality = getSceneQuality();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: quality.highQuality,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.dpr));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#08110f", 0.014);
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 160);
    camera.position.set(0, 0, 28);

    const shaderUniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.62, 0.48) },
    };

    const shaderPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 78, 1, 1),
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: shaderUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    shaderPlane.position.z = -62;
    scene.add(shaderPlane);

    const stars = createStarField({ count: quality.reduceMotion ? 1200 : quality.highQuality ? 5200 : 2200 });
    scene.add(stars.points);

    const fogLayer = createFogLayer({ count: quality.reduceMotion ? 18 : quality.highQuality ? 120 : 44 });
    scene.add(fogLayer.group);

    const pulseRings = createPulseRings();
    scene.add(pulseRings.group);

    const field = createNodeField({ nodeCount: quality.highQuality ? 116 : 72 });
    const fieldGroup = new THREE.Group();
    fieldGroup.add(field.lines, field.points, field.pulses.points);
    scene.add(fieldGroup);

    const scrollState = { progress: 0 };
    const pointer = { x: 0.62, y: 0.48, tx: 0.62, ty: 0.48 };
    const onPointerMove = (event) => {
      pointer.tx = event.clientX / window.innerWidth;
      pointer.ty = 1 - event.clientY / window.innerHeight;
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

    const q = gsap.utils.selector(section);
    const pairNarrativeViewport = section.querySelector(".pair-narrative-viewport");
    const pairNarrativeTrack = section.querySelector(".pair-narrative-track");

    gsap.set(q(".orbit-token"), {
      autoAlpha: 0,
      scale: 0.72,
    });
    if (pairNarrativeTrack) {
      gsap.set(pairNarrativeTrack, { y: 0 });
    }
    gsap.set(q(".selection-core, .probability-tile, .probability-equation, .pair-narrative"), {
      autoAlpha: 0,
      y: 18,
    });
    gsap.set(q(".pair-thread"), {
      autoAlpha: 0,
      y: 18,
    });
    gsap.set(q(".pair-person.male"), { x: -28 });
    gsap.set(q(".pair-person.female"), { x: 28 });
    gsap.set(q(".selector-ring"), { rotate: 0 });
    gsap.set(q(".orbit-caption"), { autoAlpha: 0, y: 10 });
    gsap.set(q(".probability-heading"), { autoAlpha: 1, y: 0 });

    /*
      概率幕时间线
      ------------------------------------------------------------
      这一幕解释“美好的巧合”：
      1. 16 个 MBTI 作为左侧轨道逐个出现并旋转。
      2. 12 个星座作为右侧轨道逐个出现并反向旋转。
      3. 非目标候选退场，ENFJ 与白羊停在中心。
      4. 概率数字极简展开，最后收束到 0.000513%。

      这里同样使用 pin + scrub。end 越大，观众停留越久；当前为 10800px，
      故意让开篇不急着进入后面的表白和协议。

      WebGL 背景不是静态装饰：
      - 远处星点承担“宇宙随机性”的空间感；
      - 软雾层借鉴 webgl-fog 的多片雾场思路；
      - 节点连线和能量点借鉴 neural network 的 pulse 语言；
      - shader 里的 fbm/noise 借鉴 neuro-noise，把概率计算做成会呼吸的星云。
    */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${sceneDistance("probability")}`,
        pin: true,
        scrub: sceneScrub(1.35),
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          scrollState.progress = self.progress;
          shaderUniforms.uProgress.value = self.progress;
        },
      },
    });

    tl.to(camera.position, { z: 22, duration: 0.16, ease: "none" }, 0)
      .to(field.pointMaterial, { opacity: 1, duration: 0.2 }, 0.02)
      .to(field.lineMaterial, { opacity: 0.34, duration: 0.2 }, 0.02)
      .to(field.pulses.material, { opacity: 1, duration: 0.2 }, 0.02)
      .to(fogLayer.material, { opacity: 0.04, duration: 0.2 }, 0.02)
      .to(pulseRings.warmMaterial, { opacity: 0.36, duration: 0.2 }, 0.04)
      .to(pulseRings.coolMaterial, { opacity: 0.26, duration: 0.2 }, 0.04)
      .to(q(".probability-heading"), { autoAlpha: 0.42, y: -20, duration: 0.18 }, 0.08)
      .to(q(".orbit-caption"), { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.14 }, 0.12)
      .to(q(".mbti-token"), { autoAlpha: 1, scale: 1, stagger: 0.018, duration: 0.24 }, 0.16)
      .to(q(".mbti-ring"), { rotate: 360, duration: 0.48, ease: "none" }, 0.18)
      .to(q(".zodiac-orbit-token"), { autoAlpha: 1, scale: 1, stagger: 0.022, duration: 0.26 }, 0.36)
      .to(q(".zodiac-ring"), { rotate: -360, duration: 0.3, ease: "none" }, 0.36)
      .to(q(".pair-narrative"), { autoAlpha: 1, y: 0, duration: 0.12, ease: "power3.out" }, 0.5);

    if (pairNarrativeTrack && pairNarrativeViewport) {
      tl.to(
        pairNarrativeTrack,
        {
          y: () =>
            -Math.max(0, pairNarrativeTrack.scrollHeight - pairNarrativeViewport.clientHeight) * 0.98,
          duration: 0.44,
          ease: "none",
        },
        0.5
      );
    }

    tl
      .to(q(".pair-thread"), { autoAlpha: 1, y: 0, duration: 0.12, ease: "power3.out" }, 0.8)
      .to(q(".pair-person"), { x: 0, duration: 0.12, stagger: 0.035, ease: "power3.out" }, 0.76)
      .to(q(".orbit-token:not(.selected)"), { autoAlpha: 0.08, scale: 0.72, duration: 0.12 }, 0.8)
      .to(q(".orbit-token.selected"), { autoAlpha: 1, scale: 1.34, duration: 0.14, ease: "power3.out" }, 0.82)
      .to(q(".selector-ring"), { scale: 0.76, duration: 0.14, ease: "power3.out" }, 0.83)
      .to(q(".pair-thread"), { autoAlpha: 0, y: -12, duration: 0.08, ease: "power2.out" }, 0.9)
      .to(q(".pair-narrative"), { autoAlpha: 1, y: -6, duration: 0.12, ease: "power2.out" }, 0.905)
      .to(q(".selection-core"), { autoAlpha: 1, y: 0, duration: 0.14, ease: "power3.out" }, 0.93)
      .to(q(".orbit-system"), { autoAlpha: 0.92, filter: "blur(0px)", duration: 0.1 }, 0.9)
      .to(q(".probability-heading"), { autoAlpha: 0.06, y: -36, duration: 0.1 }, 0.9)
      .to(q(".probability-tile:not(.featured)"), { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.1 }, 0.955)
      .to(q(".selection-core"), { autoAlpha: 0, y: -18, duration: 0.1, ease: "power2.inOut" }, 0.982)
      .to(q(".probability-tile:not(.featured)"), { autoAlpha: 0, y: -14, stagger: 0.026, duration: 0.08 }, 0.992)
      .to(q(".orbit-token.selected"), { autoAlpha: 1, scale: 1.08, duration: 0.08 }, 0.994)
      .to(q(".probability-tile.featured"), { autoAlpha: 1, y: 0, scale: 1.04, duration: 0.14, ease: "power3.out" }, 0.998)
      .to(camera.position, { z: 18, x: 1.8, y: 0.8, duration: 0.22, ease: "none" }, 0.88);

    let frame = 0;
    let shouldRender = false;
    let lastRenderTime = 0;
    const minFrameMs = getFrameInterval(quality.fps);
    const clock = new THREE.Clock();
    const render = () => {
      if (!shouldRender) return;

      const now = performance.now();
      if (now - lastRenderTime < minFrameMs) {
        frame = window.requestAnimationFrame(render);
        return;
      }
      lastRenderTime = now;

      const elapsed = clock.getElapsedTime();
      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      shaderUniforms.uTime.value = elapsed;
      shaderUniforms.uPointer.value.set(pointer.x, pointer.y);
      updateConnectionPulses(field.pulses, elapsed);

      stars.points.rotation.y = elapsed * 0.028 + scrollState.progress * 0.22;
      stars.points.rotation.x = Math.sin(elapsed * 0.08) * 0.055;
      fogLayer.group.rotation.z = elapsed * 0.016;
      fogLayer.group.position.x = Math.sin(elapsed * 0.07) * 2.4;
      fogLayer.group.position.y = Math.cos(elapsed * 0.05) * 1.4;
      pulseRings.group.rotation.z = elapsed * 0.055;
      pulseRings.group.position.z = -2.5 + scrollState.progress * 6;
      pulseRings.warm.scale.setScalar(1 + scrollState.progress * 0.42 + Math.sin(elapsed * 0.9) * 0.025);
      pulseRings.cool.scale.setScalar(1.06 + scrollState.progress * 0.28 + Math.cos(elapsed * 0.72) * 0.018);
      fieldGroup.rotation.y = Math.sin(elapsed * 0.16) * 0.26 + (pointer.x - 0.5) * 0.14;
      fieldGroup.rotation.x = Math.cos(elapsed * 0.13) * 0.12 - (pointer.y - 0.5) * 0.08;
      camera.lookAt((pointer.x - 0.5) * 2.2, (pointer.y - 0.5) * 1.4, -28);
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(render);
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
      window.cancelAnimationFrame(frame);
      frame = 0;
    };

    /*
      性能门控：
      ------------------------------------------------------------
      WebGL 场景只在本 section 接近视口时运行 RAF。
      否则页面一打开会同时跑多个 Three.js 渲染循环，GPU 会被直接打满。
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
      tl.scrollTrigger?.kill();
      tl.kill();
      renderer.dispose();
      stars.geometry.dispose();
      stars.material.dispose();
      fogLayer.material.dispose();
      fogLayer.texture.dispose();
      pulseRings.warm.geometry.dispose();
      pulseRings.cool.geometry.dispose();
      pulseRings.warmMaterial.dispose();
      pulseRings.coolMaterial.dispose();
      shaderPlane.geometry.dispose();
      shaderPlane.material.dispose();
      field.pointGeometry.dispose();
      field.lineGeometry.dispose();
      field.pointMaterial.dispose();
      field.lineMaterial.dispose();
      field.pulses.geometry.dispose();
      field.pulses.material.dispose();
    };
  }, [canvasRef, sectionRef]);
}
