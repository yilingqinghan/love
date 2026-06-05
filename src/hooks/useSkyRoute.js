import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { getFrameInterval, getSceneQuality } from "../utils/performance.js";
import { withBase } from "../utils/paths.js";

gsap.registerPlugin(ScrollTrigger);

const SKY_SCROLL_DISTANCE = 8400;

function createAirParticleLayer({ count = 1500 } = {}) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cold = new THREE.Color("#e6fbff");
  const warm = new THREE.Color("#fff0c7");
  const morning = new THREE.Color("#baffed");

  for (let i = 0; i < count; i += 1) {
    const radius = 30 + Math.random() * 118;
    const theta = Math.random() * Math.PI * 2;
    const yBias = THREE.MathUtils.randFloatSpread(36);
    const index = i * 3;
    const color = cold
      .clone()
      .lerp(Math.random() > 0.56 ? warm : morning, Math.random() * 0.58)
      .lerp(new THREE.Color("#ffffff"), Math.random() * 0.24);

    positions[index] = Math.cos(theta) * radius;
    positions[index + 1] = yBias + Math.sin(theta * 2.0) * 5;
    positions[index + 2] = -28 - Math.random() * 148;
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
    opacity: 0.54,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { points: new THREE.Points(geometry, material), geometry, material };
}

function createCloudTexture() {
  const texture = new THREE.TextureLoader().load(withBase("/assets/sky/cloud10.png"));
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearMipMapLinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

function createCloudOcean({ texture, count = 1800 } = {}) {
  const group = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(64, 64, 1, 1);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      fogColor: { value: new THREE.Color(0x4584b4) },
      fogNear: { value: -100 },
      fogFar: { value: 3000 },
      opacity: { value: 1 },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 mvPosition = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform vec3 fogColor;
      uniform float fogNear;
      uniform float fogFar;
      uniform float opacity;
      varying vec2 vUv;

      void main() {
        float depth = gl_FragCoord.z / gl_FragCoord.w;
        float fogFactor = smoothstep(fogNear, fogFar, depth);

        vec4 texel = texture2D(map, vUv);
        float alpha = clamp(texel.a * pow(gl_FragCoord.z, 18.0) * opacity * 1.18, 0.0, 0.92);
        vec3 cloudColor = vec3(0.96, 0.985, 1.0);
        vec3 color = mix(cloudColor, fogColor, fogFactor * 0.92);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    depthWrite: false,
    depthTest: false,
    transparent: true,
  });

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const euler = new THREE.Euler();

  /*
    直接按 Mr.doob cloud ocean 的核心参数移植：
    - 使用原版 cloud10.png；
    - 以大量 64x64 云片沿 z 轴排布；
    - y = -random^2，让云自然堆在下半部；
    - 再复制第二层，形成可循环穿云隧道。

    原 CodePen 用 THREE.GeometryUtils.merge；这里用 InstancedMesh 做现代 Three.js 版本。
  */
  for (let i = 0; i < count; i += 1) {
    position.set(
      Math.random() * 1000 - 500,
      -Math.random() * Math.random() * 200 - 15,
      i * (8000 / count)
    );
    euler.set(0, 0, Math.random() * Math.PI);
    quaternion.setFromEuler(euler);
    const cloudScale = Math.random() * Math.random() * 1.5 + 0.5;
    scale.set(cloudScale, cloudScale, 1);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(i, matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);

  const loopMesh = mesh.clone();
  loopMesh.material = material;
  loopMesh.position.z = -8000;
  group.add(loopMesh);

  return { group, mesh, loopMesh, geometry, material };
}

function createCloudCurtain({ texture, count = 34 } = {}) {
  const group = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(18, 18, 1, 1);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: "#ffffff",
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < count; i += 1) {
    const mesh = new THREE.Mesh(geometry, material);
    const row = i / count;
    const bottom = Math.random() > 0.34;
    const scale = bottom ? 2.8 + Math.random() * 4.8 : 1.6 + Math.random() * 3.2;
    mesh.position.set(
      THREE.MathUtils.randFloatSpread(96),
      bottom ? -9 + Math.random() * 7 : 6 + Math.random() * 18,
      -18 - row * 90 + THREE.MathUtils.randFloatSpread(12)
    );
    mesh.rotation.z = Math.random() * Math.PI;
    mesh.scale.set(scale * (1.7 + Math.random()), scale * (0.58 + Math.random() * 0.36), 1);
    group.add(mesh);
  }

  return { group, geometry, material };
}

function createHaloTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255, 244, 206, 0.92)");
  gradient.addColorStop(0.2, "rgba(255, 219, 145, 0.42)");
  gradient.addColorStop(0.54, "rgba(164, 228, 255, 0.16)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createContrail() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-34, -8, -30),
    new THREE.Vector3(-18, 0.5, -42),
    new THREE.Vector3(2, -1, -52),
    new THREE.Vector3(19, 8, -66),
    new THREE.Vector3(42, 10, -82),
  ]);
  const points = curve.getPoints(160);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: "#fff2ce",
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { line: new THREE.Line(geometry, material), geometry, material };
}

function createAircraftModel({ loadGltf = false } = {}) {
  const group = new THREE.Group();
  const fallback = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: "#fff3d8",
    roughness: 0.38,
    metalness: 0.18,
    emissive: "#3f5d55",
    emissiveIntensity: 0.08,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: "#a9f8ff",
    roughness: 0.18,
    metalness: 0.06,
    transparent: true,
    opacity: 0.72,
    emissive: "#8cf7ff",
    emissiveIntensity: 0.18,
  });
  const wingMaterial = new THREE.MeshStandardMaterial({
    color: "#d7fff3",
    roughness: 0.42,
    metalness: 0.12,
    transparent: true,
    opacity: 0.86,
  });
  const goldMaterial = new THREE.MeshBasicMaterial({
    color: "#ffe3a2",
    transparent: true,
    opacity: 0.9,
  });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 3.55, 28), bodyMaterial);
  fuselage.rotation.z = Math.PI / 2;
  fallback.add(fuselage);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.58, 28), bodyMaterial);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 2.06;
  fallback.add(nose);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 12), glassMaterial);
  cockpit.scale.set(1.2, 0.62, 0.9);
  cockpit.position.set(1.18, 0.22, 0);
  fallback.add(cockpit);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.07, 3.45), wingMaterial);
  wing.position.set(0.1, -0.02, 0);
  fallback.add(wing);

  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.055, 1.55), wingMaterial);
  tailWing.position.set(-1.58, 0.08, 0);
  fallback.add(tailWing);

  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.82, 0.08), wingMaterial);
  tailFin.position.set(-1.68, 0.44, 0);
  tailFin.rotation.z = -0.12;
  fallback.add(tailFin);

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), goldMaterial);
  beacon.position.set(1.8, 0.02, 0);
  fallback.add(beacon);

  group.add(fallback);

  let dracoLoader = null;
  if (loadGltf) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(withBase("/assets/draco/gltf/"));
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.load(
      withBase("/assets/flight/plane.glb"),
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z) || 1;
        const normalizedScale = 5.8 / maxAxis;

        model.position.set(
          -center.x * normalizedScale,
          -center.y * normalizedScale,
          -center.z * normalizedScale
        );
        model.scale.setScalar(normalizedScale);
        model.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = false;
          child.frustumCulled = false;
          const mat = child.material;
          if (mat?.isMeshStandardMaterial || mat?.isMeshPhysicalMaterial) {
            mat.roughness = 0.4;
            mat.metalness = 0.7;
            mat.envMapIntensity = 0.9;
          }
        });

        fallback.visible = false;
        group.add(model);
      },
      undefined,
      () => {
        fallback.visible = true;
      }
    );
  }

  group.scale.setScalar(2.65);
  group.position.set(-18, -1.6, -18);
  group.rotation.set(0.16, -0.72, 0.08);

  return {
    group,
    materials: [bodyMaterial, glassMaterial, wingMaterial, goldMaterial],
    fallback,
    dracoLoader,
    geometries: [
      fuselage.geometry,
      nose.geometry,
      cockpit.geometry,
      wing.geometry,
      tailWing.geometry,
      tailFin.geometry,
      beacon.geometry,
    ],
  };
}

export function useSkyRoute({ sectionRef, canvasRef }) {
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
    renderer.toneMapping = THREE.NoToneMapping;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(30, 1, 1, 9000);
    camera.position.set(0, 0, 6000);

    const ambient = new THREE.AmbientLight("#e8fbff", 0.64);
    const key = new THREE.DirectionalLight("#fff0c9", 1.15);
    key.position.set(18, 22, 18);
    const rim = new THREE.DirectionalLight("#baffed", 0.64);
    rim.position.set(-16, 10, -24);
    scene.add(ambient, key, rim);

    const particles = createAirParticleLayer({ count: reduceMotion ? 260 : quality.highQuality ? 1850 : 820 });
    scene.add(particles.points);

    const cloudTexture = createCloudTexture();
    const cloudOcean = createCloudOcean({
      texture: cloudTexture,
      count: reduceMotion ? 1800 : quality.highQuality ? 8000 : 5200,
    });
    scene.add(cloudOcean.group);

    const cloudCurtain = createCloudCurtain({
      texture: cloudTexture,
      count: reduceMotion ? 8 : quality.highQuality ? 38 : 20,
    });
    cloudCurtain.group.visible = false;
    scene.add(cloudCurtain.group);

    const haloTexture = createHaloTexture();
    const sun = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: haloTexture,
        color: "#fff0c7",
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    sun.position.set(27, 15, -62);
    sun.scale.set(29, 29, 1);
    scene.add(sun);

    const contrail = createContrail();
    scene.add(contrail.line);

    const aircraft = createAircraftModel({ loadGltf: quality.highQuality });
    aircraft.group.visible = quality.highQuality;
    scene.add(aircraft.group);

    const scrollState = { progress: 0 };
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointerMove);

    const setSize = () => {
      const width = section.clientWidth || window.innerWidth;
      const height = section.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      positionPlaneOnPath(planeProgress.value);
    };

    const q = gsap.utils.selector(section);
    const linesViewport = section.querySelector(".sky-lines-viewport");
    const linesTrack = section.querySelector(".sky-lines-track");
    const routePath = section.querySelector(".route-core");
    const planeEl = section.querySelector(".paper-plane");
    const planeShadowEl = section.querySelector(".plane-shadow");

    const positionPlaneOnPath = (progress) => {
      if (!routePath || !planeEl) return;

      const pathLength = routePath.getTotalLength();
      const current = routePath.getPointAtLength(pathLength * progress);
      const ahead = routePath.getPointAtLength(Math.min(pathLength, pathLength * progress + 2));
      const sectionRect = section.getBoundingClientRect();
      const svgEl = routePath.ownerSVGElement;
      const svgRect = svgEl?.getBoundingClientRect() ?? sectionRect;
      const viewBox = svgEl?.viewBox?.baseVal;
      const scaleX = viewBox?.width ? svgRect.width / viewBox.width : 1;
      const scaleY = viewBox?.height ? svgRect.height / viewBox.height : 1;
      const x = svgRect.left - sectionRect.left + current.x * scaleX - planeEl.offsetWidth * 0.5;
      const y = svgRect.top - sectionRect.top + current.y * scaleY - planeEl.offsetHeight * 0.48;
      const angle = (Math.atan2(ahead.y - current.y, ahead.x - current.x) * 180) / Math.PI;

      gsap.set(planeEl, { x, y, rotate: angle - 10 });

      if (planeShadowEl) {
        gsap.set(planeShadowEl, {
          x: x - planeEl.offsetWidth * 0.04,
          y: y + planeEl.offsetHeight * 0.86,
          rotate: angle * 0.1,
        });
      }
    };

    const planeProgress = { value: 0.02 };
    gsap.set(q(".sky-line, .route-node, .route-label, .sky-handoff"), {
      autoAlpha: 0,
      y: 16,
    });
    gsap.set(linesTrack, { y: 0 });
    gsap.set(q(".sky-route-path"), { autoAlpha: 0 });
    gsap.set(q(".paper-plane"), { autoAlpha: 0, scale: 0.78, rotate: -10 });
    gsap.set(q(".plane-shadow"), { autoAlpha: 0, scaleX: 0.46 });
    gsap.set(q(".kite"), { autoAlpha: 0, scale: 0.72, rotate: 36 });
    gsap.set(q(".kite-string"), { scaleY: 0, transformOrigin: "50% 0%" });
    gsap.set(q(".balloon"), { autoAlpha: 0, y: 24 });
    gsap.set(q(".sky-cloud-shelf"), { autoAlpha: 0, y: 34 });
    gsap.set(q(".sky-flight-card, .flight-route-box, .flight-stat, .flight-duration, .flight-progress-path"), {
      autoAlpha: 0,
      y: 18,
    });
    gsap.set(q(".flight-progress-path"), { strokeDashoffset: 1 });
    positionPlaneOnPath(planeProgress.value);
    setSize();
    window.addEventListener("resize", setSize);

    /*
      天空航路时间线
      ------------------------------------------------------------
      这版吸收了两个参考：
      1. three-js-cloud-ocean-from-mr-doob：用大量半透明云片铺成穿云隧道，
         滚动时镜头和云层一起推进，产生“从星空进入真实天空”的震撼感。
      2. flight-status-card-turbokit：把航路做成飞行状态卡，避免只有抽象文字。

      想调节震撼程度：
      - createCloudOcean 的 count 越高云越厚，但性能开销也越高。
      - ScrollTrigger end 越大，这幕停留越久。
      - aircraft.group 的 tween 决定 3D 飞机穿云的路线。
    */
    const skyTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${SKY_SCROLL_DISTANCE}`,
        pin: true,
        scrub: 1.12,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          scrollState.progress = self.progress;
        },
      },
    });

    skyTl
      .to(cloudOcean.material.uniforms.opacity, { value: 0.95, duration: 0.32, ease: "none" }, 0.02)
      .to(cloudCurtain.material, { opacity: 0.66, duration: 0.32, ease: "none" }, 0.02)
      .to(q(".sky-cloud-shelf"), { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.3 }, 0.04)
      .to(q(".shelf-back"), { y: -34, duration: 0.58, ease: "none" }, 0.18)
      .to(q(".shelf-front"), { y: -58, duration: 0.58, ease: "none" }, 0.22)
      .to(particles.material, { opacity: 0.28, duration: 0.42, ease: "none" }, 0.02)
      .to(sun.material, { opacity: 0.72, duration: 0.42, ease: "power3.out" }, 0.04)
      .to(contrail.material, { opacity: 0.54, duration: 0.4, ease: "power3.out" }, 0.08)
      .to(aircraft.group.position, { x: -2, y: 1.6, z: -27, duration: 0.38, ease: "power3.out" }, 0.06)
      .to(aircraft.group.rotation, { x: 0.04, y: -0.56, z: 0.16, duration: 0.38, ease: "power3.out" }, 0.06)
      .to(q(".sky-copy"), { y: -14, duration: 0.24, ease: "power3.out" }, 0.08)
      .to(q(".sky-line"), { autoAlpha: 1, y: 0, duration: 0.16 }, 0.1)
      .to(
        linesTrack,
        {
          y: () => {
            if (!linesViewport || !linesTrack) return 0;
            return -Math.max(0, linesTrack.scrollHeight - linesViewport.clientHeight) * 1.04;
          },
          duration: 0.9,
          ease: "none",
        },
        0.14
      )
      .to(q(".sky-route-path"), { autoAlpha: 1, duration: 0.24, ease: "power3.out" }, 0.18)
      .to(q(".route-node"), { autoAlpha: 1, y: 0, scale: 1.2, stagger: 0.08, duration: 0.18 }, 0.25)
      .to(q(".route-label"), { autoAlpha: 1, y: 0, stagger: 0.07, duration: 0.2 }, 0.28)
      .to(q(".paper-plane"), { autoAlpha: 1, scale: 1, duration: 0.18, ease: "power3.out" }, 0.23)
      .to(q(".plane-shadow"), { autoAlpha: 0.28, scaleX: 1, duration: 0.18 }, 0.26)
      .to(
        planeProgress,
        {
          value: 0.98,
          duration: 0.42,
          ease: "power2.inOut",
          onUpdate: () => positionPlaneOnPath(planeProgress.value),
        },
        0.34
      )
      .to(q(".sky-flight-card"), { autoAlpha: 1, y: 0, duration: 0.22, ease: "power3.out" }, 0.42)
      .to(q(".flight-route-box"), { autoAlpha: 1, y: 0, stagger: 0.055, duration: 0.2 }, 0.47)
      .to(q(".flight-duration"), { autoAlpha: 1, y: 0, duration: 0.2 }, 0.5)
      .to(q(".flight-progress-path"), { autoAlpha: 1, y: 0, strokeDashoffset: 0, duration: 0.34 }, 0.52)
      .to(q(".flight-stat"), { autoAlpha: 1, y: 0, stagger: 0.055, duration: 0.2 }, 0.58)
      .to(q(".kite-string"), { scaleY: 1, duration: 0.28, ease: "power3.out" }, 0.48)
      .to(q(".kite"), { autoAlpha: 1, scale: 1, rotate: 45, duration: 0.22 }, 0.52)
      .to(q(".balloon-one"), { autoAlpha: 0.38, y: 0, x: -22, duration: 0.28 }, 0.58)
      .to(q(".balloon-two"), { autoAlpha: 0.22, y: -12, x: 18, duration: 0.28 }, 0.64)
      .to(
        aircraft.group.position,
        {
          x: 16,
          y: 6.4,
          z: -34,
          duration: 0.34,
          ease: "power3.out",
        },
        0.62
      )
      .to(aircraft.group.rotation, { x: -0.05, y: -0.42, z: -0.04, duration: 0.34 }, 0.62)
      .to(q(".paper-plane"), { autoAlpha: 0.16, scale: 0.72, duration: 0.18 }, 0.72)
      .to(q(".plane-shadow"), { autoAlpha: 0.04, scaleX: 0.5, duration: 0.18 }, 0.74)
      .to(q(".sky-copy"), { autoAlpha: 0.78, filter: "blur(0.2px)", duration: 0.18 }, 0.9)
      .to(q(".sky-flight-card"), { autoAlpha: 0.78, y: -8, duration: 0.16 }, 0.84)
      .to(q(".sky-handoff"), { autoAlpha: 1, y: 0, duration: 0.2, ease: "power3.out" }, 0.88);

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

      const cloudTravel = (elapsed * 30 + scrollState.progress * 2600) % 8000;
      particles.points.rotation.y = elapsed * 0.006 + scrollState.progress * 0.22;
      particles.points.rotation.x = Math.sin(elapsed * 0.08) * 0.025 - pointer.y * 0.012;
      camera.position.x += (pointer.x * 38 - camera.position.x) * 0.035;
      camera.position.y += (-pointer.y * 24 - camera.position.y) * 0.035;
      camera.position.z = -cloudTravel + 8000;
      cloudCurtain.group.position.x = Math.sin(elapsed * 0.055) * 1.6 - scrollState.progress * 4.2;
      cloudCurtain.group.position.z = scrollState.progress * 16;
      cloudCurtain.group.position.y = Math.cos(elapsed * 0.05) * 0.4 - scrollState.progress * 1.8;
      sun.position.x = 27 - scrollState.progress * 7.2;
      sun.position.y = 15 + Math.sin(elapsed * 0.18) * 0.22;
      sun.scale.setScalar(29 + scrollState.progress * 10 + Math.sin(elapsed * 0.24) * 0.5);
      contrail.line.position.x = -scrollState.progress * 3.2;
      contrail.line.position.y = Math.sin(elapsed * 0.1) * 0.2;
      aircraft.group.position.y += Math.sin(elapsed * 0.9) * 0.003;
      aircraft.group.rotation.x += Math.sin(elapsed * 0.8) * 0.0006;
      aircraft.group.rotation.z += Math.cos(elapsed * 0.6) * 0.0007;

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
      天空幕的云层和 3D 飞机比较重，只在接近视口时启动 RAF。
      离开这一幕后立即暂停，避免页面静置时 GPU 持续满载。
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
      skyTl.scrollTrigger?.kill();
      skyTl.kill();
      renderer.dispose();
      particles.geometry.dispose();
      particles.material.dispose();
      cloudOcean.geometry.dispose();
      cloudOcean.material.dispose();
      cloudCurtain.geometry.dispose();
      cloudCurtain.material.dispose();
      cloudTexture.dispose();
      haloTexture.dispose();
      sun.material.dispose();
      contrail.geometry.dispose();
      contrail.material.dispose();
      aircraft.geometries.forEach((geometry) => geometry.dispose());
      aircraft.materials.forEach((material) => material.dispose());
      aircraft.dracoLoader?.dispose();
    };
  }, [canvasRef, sectionRef]);
}
