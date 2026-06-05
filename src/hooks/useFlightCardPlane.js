import { useEffect } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { getFrameInterval, getSceneQuality } from "../utils/performance.js";
import { withBase } from "../utils/paths.js";

export function useFlightCardPlane({ canvasRef, sectionRef }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return undefined;

    const quality = getSceneQuality();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: quality.highQuality,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.highQuality ? 1.2 : 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
    camera.position.set(0, 10, 78);

    const modelGroup = new THREE.Group();
    const baseYaw = Math.PI / 1.6;
    scene.add(modelGroup);

    scene.add(new THREE.AmbientLight("#ffffff", 0.72));
    const rimLight = new THREE.DirectionalLight("#ffffff", 0.72);
    rimLight.position.set(-5, 5, 10);
    scene.add(rimLight);
    const fillLight = new THREE.DirectionalLight("#fff0c7", 0.52);
    fillLight.position.set(7, 4, 6);
    scene.add(fillLight);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(withBase("/assets/draco/gltf/"));
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    let disposed = false;
    let loadedModel = null;
    loader.load(withBase("/assets/flight/plane.glb"), (gltf) => {
      if (disposed) return;
      loadedModel = gltf.scene;
      loadedModel.traverse((child) => {
        if (!child.isMesh) return;
        child.frustumCulled = false;
        const mat = child.material;
        if (mat?.isMeshStandardMaterial || mat?.isMeshPhysicalMaterial) {
          mat.roughness = 0.4;
          mat.metalness = 0.7;
          mat.envMapIntensity = 0.9;
        }
      });
      const box = new THREE.Box3().setFromObject(loadedModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z) || 1;
      const normalizedScale = 86 / maxAxis;
      loadedModel.scale.setScalar(normalizedScale);
      loadedModel.position.set(
        -center.x * normalizedScale,
        -center.y * normalizedScale - 1.2,
        -center.z * normalizedScale
      );
      modelGroup.add(loadedModel);
    });

    const setSize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const safeWidth = Math.max(1, width);
      const safeHeight = Math.max(1, height);
      renderer.setSize(safeWidth, safeHeight, false);
      camera.aspect = safeWidth / safeHeight;
      camera.updateProjectionMatrix();
    };
    setSize();
    window.addEventListener("resize", setSize);

    let frameId = 0;
    let shouldRender = false;
    let lastRenderTime = 0;
    const minFrameMs = getFrameInterval(quality.highQuality ? 24 : 18);
    const clock = new THREE.Clock();

    const render = () => {
      if (!shouldRender) return;

      const now = performance.now();
      if (now - lastRenderTime < minFrameMs) {
        frameId = window.requestAnimationFrame(render);
        return;
      }
      lastRenderTime = now;

      const t = clock.getElapsedTime();
      const yaw = baseYaw + Math.sin(t * 0.25) * 0.1;
      const pitch = Math.sin(t * 0.35) * 0.05;
      const roll = Math.sin(t * 0.5) * 0.07;

      modelGroup.rotation.set(pitch, yaw, roll);
      camera.lookAt(0, 0, 0);
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startRender();
        else stopRender();
      },
      { rootMargin: quality.rootMargin, threshold: 0 }
    );
    observer.observe(section);

    const onVisibilityChange = () => {
      if (document.hidden) stopRender();
      else {
        const rect = section.getBoundingClientRect();
        const margin = quality.highQuality ? window.innerHeight * 0.6 : 0;
        if (rect.bottom >= -margin && rect.top <= window.innerHeight + margin) startRender();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      stopRender();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", setSize);
      if (loadedModel) {
        loadedModel.traverse((child) => {
          if (!child.isMesh) return;
          child.geometry?.dispose?.();
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => material?.dispose?.());
        });
      }
      renderer.dispose();
      dracoLoader.dispose();
    };
  }, [canvasRef, sectionRef]);
}
