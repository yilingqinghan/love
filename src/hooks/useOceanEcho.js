import { useEffect } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { Water } from "three/examples/jsm/objects/Water.js";

import { getFrameInterval, getSceneQuality } from "../utils/performance.js";

gsap.registerPlugin(ScrollTrigger, CustomEase);

const OCEAN_SCROLL_DISTANCE = 9400;

const DOLPHIN_MODEL_URL = "/assets/ocean/dolphin.glb";
const WATER_NORMALS_URL = "/assets/ocean/dolphin-waternormals.jpg";

const dolphinEase = CustomEase.create(
  "dolphin-dawn",
  "M0,0,C0.042,0.224,0.268,0.35,0.524,0.528,0.708,0.656,0.876,0.808,1,1"
);

const path = new THREE.Path();
path.moveTo(0, 40);
path.bezierCurveTo(39.4459, 17.0938, 62.5, 0, 100, 0);
path.bezierCurveTo(137.5, 0, 173.133, 19.1339, 200, 40);
const pathPoints = path.getPoints();

function mapValue(value, sMin, sMax, dMin, dMax) {
  return dMin + ((value - sMin) / (sMax - sMin)) * (dMax - dMin);
}

function createStarTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255, 245, 210, 0.92)");
  gradient.addColorStop(0.18, "rgba(255, 226, 160, 0.34)");
  gradient.addColorStop(0.54, "rgba(190, 255, 240, 0.1)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function createSkyParticles({ count = 1200 } = {}) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const warm = new THREE.Color("#fff0c9");
  const teal = new THREE.Color("#c7fff0");

  for (let i = 0; i < count; i += 1) {
    const index = i * 3;
    const x = THREE.MathUtils.randFloatSpread(112);
    const y = 1.5 + Math.random() * 32;
    const z = -44 - Math.random() * 82;
    const color = warm.clone().lerp(teal, Math.random() * 0.5).lerp(new THREE.Color("#ffffff"), Math.random() * 0.18);

    positions[index] = x;
    positions[index + 1] = y;
    positions[index + 2] = z;
    colors[index] = color.r;
    colors[index + 1] = color.g;
    colors[index + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.44,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { points: new THREE.Points(geometry, material), geometry, material };
}

function createReflectionLines({ count = 72 } = {}) {
  const vertices = [];
  const colors = [];
  const gold = new THREE.Color("#ffe8b6");
  const teal = new THREE.Color("#c7fff0");

  for (let i = 0; i < count; i += 1) {
    const x = THREE.MathUtils.randFloatSpread(120);
    const z = 6 + Math.random() * 112;
    const length = 0.8 + Math.random() * 4.6;
    const color = gold.clone().lerp(teal, Math.random() * 0.34);

    vertices.push(new THREE.Vector3(x - length, 0.12, z), new THREE.Vector3(x + length, 0.12, z + Math.random() * 1.4));
    colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { lines: new THREE.LineSegments(geometry, material), geometry, material };
}

function createEchoRing({ x, z, color }) {
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.22, 96), material);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.24, z);
  return { ring, material };
}

function getCurve(wMin, wMax, hMin, hMax, z) {
  const initialPoints = pathPoints.map(
    ({ x, y }) =>
      new THREE.Vector3(
        mapValue(x, 0, 200, wMin, wMax),
        mapValue(y, 0, 40, hMax, hMin),
        z
      )
  );
  const curve = new THREE.CatmullRomCurve3(initialPoints);
  curve.curveType = "centripetal";
  curve.closed = false;
  return curve;
}

function addPath(scene, mesh, curve, playHead, resources) {
  const geometry = mesh.geometry.clone();
  geometry.rotateZ(-Math.PI * 0.5);

  const material = mesh.material.clone();
  const numPoints = 511;
  const cPoints = curve.getSpacedPoints(numPoints);
  const cObjects = curve.computeFrenetFrames(numPoints, true);

  const data = [];
  cPoints.forEach((v) => data.push(v.x, v.y, v.z, 1));
  cObjects.binormals.forEach((v) => data.push(v.x, v.y, v.z, 1));
  cObjects.normals.forEach((v) => data.push(v.x, v.y, v.z, 1));
  cObjects.tangents.forEach((v) => data.push(v.x, v.y, v.z, 1));

  const dataArray = new Float32Array(data);
  const spatialTexture = new THREE.DataTexture(dataArray, numPoints + 1, 4, THREE.RGBAFormat, THREE.FloatType);
  spatialTexture.minFilter = THREE.NearestFilter;
  spatialTexture.magFilter = THREE.NearestFilter;
  spatialTexture.wrapS = THREE.ClampToEdgeWrapping;
  spatialTexture.wrapT = THREE.ClampToEdgeWrapping;
  spatialTexture.needsUpdate = true;

  const objBox = new THREE.Box3().setFromBufferAttribute(geometry.getAttribute("position"));
  const objSize = new THREE.Vector3();
  objBox.getSize(objSize);

  const objUniforms = {
    uSpatialTexture: { value: spatialTexture },
    uTextureSize: { value: new THREE.Vector2(numPoints + 1, 4) },
    uTime: playHead,
    uLengthRatio: { value: objSize.z / curve.getLength() },
    uObjSize: { value: objSize },
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms = { ...shader.uniforms, ...objUniforms };
    shader.vertexShader =
      `
        uniform sampler2D uSpatialTexture;
        uniform vec2 uTextureSize;
        uniform float uTime;
        uniform float uLengthRatio;
        uniform vec3 uObjSize;

        struct splineData {
          vec3 point;
          vec3 binormal;
          vec3 normal;
        };

        splineData getSplineData(float t){
          float xstep = 1. / uTextureSize.y;
          float halfStep = xstep * 0.5;
          splineData sd;
          sd.point    = texture2D(uSpatialTexture, vec2(t, xstep * 0. + halfStep)).rgb;
          sd.binormal = texture2D(uSpatialTexture, vec2(t, xstep * 1. + halfStep)).rgb;
          sd.normal   = texture2D(uSpatialTexture, vec2(t, xstep * 2. + halfStep)).rgb;
          return sd;
        }
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>

        vec3 pos = position;

        float wStep = 1. / uTextureSize.x;
        float hWStep = wStep * 0.5;

        float d = pos.z / uObjSize.z;
        float t = uTime + (d * uLengthRatio);
        float numPrev = floor(t / wStep);
        float numNext = numPrev + 1.;
        float tPrev = numPrev * wStep + hWStep;
        float tNext = numNext * wStep + hWStep;
        splineData splinePrev = getSplineData(tPrev);
        splineData splineNext = getSplineData(tNext);

        float f = (t - tPrev) / wStep;
        vec3 P = mix(splinePrev.point, splineNext.point, f);
        vec3 B = mix(splinePrev.binormal, splineNext.binormal, f);
        vec3 N = mix(splinePrev.normal, splineNext.normal, f);

        transformed = P + (N * pos.x) + (B * pos.y);
    `
    );
  };
  material.needsUpdate = true;

  const dolphin = new THREE.Mesh(geometry, material);
  scene.add(dolphin);
  resources.push({ mesh: dolphin, geometry, material, spatialTexture });
}

function addDolphinsAtDawn(scene, resources) {
  const playHead1 = { value: 0 };
  const playHead2 = { value: 0 };
  const playHead3 = { value: 0 };
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
  tl.to(playHead1, { value: 1, duration: 3, ease: dolphinEase }, 0.3);
  tl.to(playHead2, { value: 1, duration: 3, ease: dolphinEase }, 0);
  tl.to(playHead3, { value: 1, duration: 3, ease: dolphinEase }, 0.4);

  const curves = [
    getCurve(-140, 80, -10, 20, 10),
    getCurve(-100, 100, -15, 25, 30),
    getCurve(-80, 120, -10, 20, 50),
  ];
  const playHeads = [playHead1, playHead2, playHead3];
  const loader = new GLTFLoader();

  curves.forEach((curve, index) => {
    loader.load(DOLPHIN_MODEL_URL, (gltf) => {
      const mesh = gltf.scene.children[0];
      addPath(scene, mesh, curve, playHeads[index], resources);
    });
  });

  return tl;
}

export function useOceanEcho({ sectionRef, canvasRef }) {
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
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 1, 20000);
    camera.position.set(3.1590873116966085, 12.558741624242224, 162.85051507508345);
    camera.rotation.set(-0.01571091803028279, 0.019393868089754202, 0.0003047014328572437);
    camera.lookAt(0, 10, 0);

    const sun = new THREE.Vector3();
    const sky = new Sky();
    sky.scale.setScalar(10000);
    const skyUniforms = sky.material.uniforms;
    skyUniforms.turbidity.value = 10;
    skyUniforms.rayleigh.value = 2;
    skyUniforms.mieCoefficient.value = 0.005;
    skyUniforms.mieDirectionalG.value = 0.8;
    scene.add(sky);

    const waterNormals = new THREE.TextureLoader().load(
      WATER_NORMALS_URL,
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    );
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
    const water = new Water(new THREE.PlaneGeometry(10000, 10000), {
      textureWidth: quality.highQuality ? 512 : 256,
      textureHeight: quality.highQuality ? 512 : 256,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: reduceMotion ? 2.2 : 3.7,
      fog: scene.fog !== undefined,
    });
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const setSun = (elevation = 2, azimuth = 180) => {
      const phi = THREE.MathUtils.degToRad(90 - elevation);
      const theta = THREE.MathUtils.degToRad(azimuth);
      sun.setFromSphericalCoords(1, phi, theta);
      sky.material.uniforms.sunPosition.value.copy(sun);
      water.material.uniforms.sunDirection.value.copy(sun).normalize();
      scene.environment?.dispose?.();
      scene.environment = pmremGenerator.fromScene(sky).texture;
    };
    setSun();

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const particles = createSkyParticles({ count: reduceMotion ? 260 : quality.highQuality ? 1300 : 620 });
    scene.add(particles.points);

    const reflections = createReflectionLines({ count: reduceMotion ? 20 : quality.highQuality ? 86 : 42 });
    scene.add(reflections.lines);

    const starTexture = createStarTexture();
    const dawnOrb = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: starTexture,
        color: "#fff0c9",
        transparent: true,
        opacity: 0.36,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    dawnOrb.position.set(-78, 30, -120);
    dawnOrb.scale.set(30, 30, 1);
    scene.add(dawnOrb);

    const dolphinResources = [];
    const dolphinTl = addDolphinsAtDawn(scene, dolphinResources);

    const echoRings = [
      createEchoRing({ x: -42, z: 20, color: "#ffe8b6" }),
      createEchoRing({ x: 8, z: 38, color: "#c7fff0" }),
      createEchoRing({ x: 52, z: 56, color: "#fff1cc" }),
    ];
    echoRings.forEach(({ ring }) => scene.add(ring));

    const q = gsap.utils.selector(section);
    const linesViewport = section.querySelector(".ocean-lines-viewport");
    const linesTrack = section.querySelector(".ocean-lines-track");
    gsap.set(q(".ocean-line, .echo-card, .ocean-artifact, .ocean-coordinate, .ocean-handoff"), {
      autoAlpha: 0,
      y: 18,
    });
    gsap.set(q(".ocean-copy"), { autoAlpha: 1, y: 0 });
    gsap.set(linesTrack, { y: 0 });

    /*
      人海回声时间线
      ------------------------------------------------------------
      这一幕承接天空航路：航线落入“人海”，但不是突兀的海洋装饰。
      海面承担三个隐喻：
      1. 茫茫人海：大面积流动水面，表达世界的噪声与不确定性。
      2. 回声：三个水面圆环对应 120 minutes、ride/hug、dream night。
      3. 留存：回声环没有立刻消失，说明某个信号真的被保存了下来。

      想调节停留时间：
      - 改 ScrollTrigger 的 end，例如 "+=5200" 更快，"+=7600" 更慢。
      想改变浪强度：
      - 改 Water 的 distortionScale 和 waterColor。
    */
    const oceanTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${OCEAN_SCROLL_DISTANCE}`,
        pin: true,
        scrub: 1.18,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    oceanTl
      .to(particles.material, { opacity: 0.7, duration: 0.24, ease: "none" }, 0.04)
      .to(reflections.material, { opacity: 0.36, duration: 0.28, ease: "power3.out" }, 0.08)
      .to(dawnOrb.material, { opacity: 0.64, duration: 0.32, ease: "power3.out" }, 0.08)
      .to(q(".ocean-copy"), { y: -8, duration: 0.24, ease: "power3.out" }, 0.06)
      .to(q(".ocean-line"), { autoAlpha: 1, y: 0, duration: 0.16 }, 0.08)
      .to(
        linesTrack,
        {
          y: () => {
            if (!linesViewport || !linesTrack) return 0;
            return -Math.max(0, linesTrack.scrollHeight - linesViewport.clientHeight) * 1.08;
          },
          duration: 0.94,
          ease: "none",
        },
        0.12
      )
      .to(q(".echo-card.e1"), { autoAlpha: 1, y: 0, duration: 0.22, ease: "power3.out" }, 0.32)
      .to(echoRings[0].material, { opacity: 0.72, duration: 0.18 }, 0.32)
      .to(echoRings[0].ring.scale, { x: 4.2, y: 4.2, z: 4.2, duration: 0.34, ease: "power3.out" }, 0.32)
      .to(q(".echo-card.e2"), { autoAlpha: 1, y: 0, duration: 0.22, ease: "power3.out" }, 0.46)
      .to(echoRings[1].material, { opacity: 0.62, duration: 0.18 }, 0.46)
      .to(echoRings[1].ring.scale, { x: 4.8, y: 4.8, z: 4.8, duration: 0.34, ease: "power3.out" }, 0.46)
      .to(q(".echo-card.e3"), { autoAlpha: 1, y: 0, duration: 0.22, ease: "power3.out" }, 0.6)
      .to(echoRings[2].material, { opacity: 0.66, duration: 0.18 }, 0.6)
      .to(echoRings[2].ring.scale, { x: 5.2, y: 5.2, z: 5.2, duration: 0.34, ease: "power3.out" }, 0.6)
      .to(q(".ocean-artifact"), { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.22 }, 0.68)
      .to(q(".ocean-coordinate"), { autoAlpha: 1, y: 0, duration: 0.22, ease: "power3.out" }, 0.74)
      .to(q(".ocean-copy"), { autoAlpha: 1, filter: "blur(0px)", duration: 0.18 }, 0.84)
      .to(q(".ocean-handoff"), { autoAlpha: 1, y: 0, duration: 0.2, ease: "power3.out" }, 0.88)
      .to(echoRings.map((item) => item.material), { opacity: 0.18, duration: 0.16 }, 0.9);

    const setSize = () => {
      const width = section.clientWidth || window.innerWidth;
      const height = section.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    setSize();
    window.addEventListener("resize", setSize);

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
      water.material.uniforms.time.value += 1 / quality.fps;

      particles.points.rotation.y = elapsed * 0.008;
      particles.points.position.x = Math.sin(elapsed * 0.05) * 0.8;
      reflections.lines.position.x = Math.sin(elapsed * 0.1) * 0.42;
      reflections.material.opacity = 0.16 + Math.sin(elapsed * 0.7) * 0.035;
      dawnOrb.position.y = 30 + Math.sin(elapsed * 0.16) * 0.34;
      dawnOrb.scale.setScalar(30 + Math.sin(elapsed * 0.22) * 0.5);
      echoRings.forEach(({ ring }, index) => {
        const baseScale = ring.scale.x;
        const ripple = Math.sin(elapsed * 0.9 + index) * 0.018;
        ring.scale.y = Math.max(0.1, baseScale + ripple);
        ring.scale.z = baseScale;
        ring.rotation.z = elapsed * (0.018 + index * 0.006);
      });
      camera.lookAt(0, 10, 0);
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
      海面 shader 只在本幕接近视口时持续刷新。
      离开后暂停 RAF，降低静置页面的 GPU 占用。
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
      window.removeEventListener("resize", setSize);
      oceanTl.scrollTrigger?.kill();
      oceanTl.kill();
      dolphinTl.kill();
      scene.environment?.dispose?.();
      pmremGenerator.dispose();
      renderer.dispose();
      water.geometry.dispose();
      water.material.dispose();
      waterNormals.dispose();
      sky.geometry.dispose();
      sky.material.dispose();
      particles.geometry.dispose();
      particles.material.dispose();
      reflections.geometry.dispose();
      reflections.material.dispose();
      starTexture.dispose();
      dawnOrb.material.dispose();
      dolphinResources.forEach(({ geometry, material, spatialTexture }) => {
        geometry.dispose();
        material.dispose();
        spatialTexture?.dispose?.();
      });
      echoRings.forEach(({ ring, material }) => {
        ring.geometry.dispose();
        material.dispose();
      });
    };
  }, [canvasRef, sectionRef]);
}
