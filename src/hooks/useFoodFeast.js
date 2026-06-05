import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

gsap.registerPlugin(ScrollTrigger);

const MODEL_SET = [
  { path: "/assets/food-kit/cup-coffee.glb", scale: 1.4, spin: 0.8 },
  { path: "/assets/food-kit/cupcake.glb", scale: 1.55, spin: 1.2 },
  { path: "/assets/food-kit/burger.glb", scale: 1.28, spin: 0.9 },
  { path: "/assets/food-kit/pizza.glb", scale: 1.35, spin: 1.15 },
  { path: "/assets/food-kit/fries.glb", scale: 1.32, spin: 1.05 },
];

const DROP_LAYOUTS = [
  { x: 1.05, y: 4.6, z: -1.0, vx: 0.2, vy: -0.65, vz: 0.03 },
  { x: 2.35, y: 5.0, z: -0.25, vx: 0.1, vy: -0.72, vz: -0.02 },
  { x: 3.7, y: 5.2, z: -0.8, vx: -0.08, vy: -0.76, vz: 0.04 },
  { x: 5.05, y: 4.8, z: -0.1, vx: -0.16, vy: -0.68, vz: -0.02 },
  { x: 6.15, y: 5.1, z: -1.05, vx: -0.22, vy: -0.74, vz: 0.05 },
];

function cloneRenderable(object) {
  const clone = object.clone(true);
  clone.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return clone;
}

function parkActor(actor) {
  actor.mesh.position.set(100, -100, 0);
  actor.mesh.rotation.set(0, 0, 0);
  actor.velocity.set(0, 0, 0);
  actor.rotationVelocity.set(0, 0, 0);
  actor.active = false;
  actor.settled = false;
}

export function useFoodFeast({ sectionRef, canvasRef }) {
  const visibleRef = useRef(false);
  const apiRef = useRef({
    launchAll: null,
    resetAll: null,
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const q = gsap.utils.selector(section);
    const noteViewport = section.querySelector(".food-note-viewport");
    const noteTrack = section.querySelector(".food-note-track");
    const ctx = gsap.context(() => {
      gsap.set(q(".food-stage-header, .food-note, .food-card-stack, .food-card-shell"), {
        autoAlpha: 0,
        y: 26,
      });
      gsap.set(q(".food-canvas-wrap"), { autoAlpha: 0 });
      gsap.set(q(".food-menu-frame"), { filter: "blur(0px)", scale: 1, transformOrigin: "50% 50%" });
      gsap.set(q(".food-feast-dim"), { backgroundColor: "rgba(255, 255, 255, 0)" });
      gsap.set(noteTrack, { y: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=4800",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onEnter: () => {
            visibleRef.current = true;
          },
          onEnterBack: () => {
            visibleRef.current = true;
          },
          onLeave: () => {
            visibleRef.current = false;
          },
          onLeaveBack: () => {
            visibleRef.current = false;
          },
          onUpdate: (self) => {
            if (self.progress > 0.3) {
              apiRef.current.launchAll?.();
            }

            if (self.progress < 0.17) {
              apiRef.current.resetAll?.();
            }
          },
        },
      });

      tl
        .to(q(".food-stage-header"), { autoAlpha: 1, y: 0, duration: 0.12, ease: "power2.out" }, 0.05)
        .to(q(".food-canvas-wrap"), { autoAlpha: 1, duration: 0.12, ease: "power2.out" }, 0.28)
        .to(
          q(".food-menu-frame"),
          { filter: "blur(6px)", scale: 1.015, duration: 0.22, ease: "power2.out" },
          0.72
        )
        .to(q(".food-feast-dim"), { backgroundColor: "rgba(255, 255, 255, 0.18)", duration: 0.2 }, 0.72)
        .to(q(".food-card-stack"), { autoAlpha: 1, y: 0, duration: 0.18, ease: "power3.out" }, 0.74)
        .to(
          q(".food-card-shell"),
          { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.16, ease: "power3.out" },
          0.78
        )
        .to(q(".food-note"), { autoAlpha: 1, y: 0, duration: 0.16, ease: "power3.out" }, 0.88)
        .to(
          noteTrack,
          {
            y: () => {
              if (!noteViewport || !noteTrack) return 0;
              return -Math.max(0, noteTrack.scrollHeight - noteViewport.clientHeight);
            },
            duration: 0.54,
            ease: "none",
          },
          0.92
        );
    }, section);

    return () => ctx.revert();
  }, [sectionRef]);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return undefined;

    let frameId = 0;
    let disposed = false;
    let launched = false;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(3.45, 2.65, 12.8);
    camera.lookAt(3.25, 0.1, -0.2);
    scene.add(camera);

    const ambient = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffefdb, 2.2);
    key.position.set(4.8, 7.4, 5.8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 24;
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    scene.add(key);

    const fill = new THREE.PointLight(0xffd9a8, 0.8, 24);
    fill.position.set(1.6, 4.8, 6);
    scene.add(fill);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 9),
      new THREE.ShadowMaterial({ opacity: 0.14 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(3.2, -2.12, -0.25);
    floor.receiveShadow = true;
    scene.add(floor);

    const loader = new GLTFLoader();
    const actors = [];
    const clock = new THREE.Clock();

    const resize = () => {
      const width = section.clientWidth;
      const height = section.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resetAll = () => {
      launched = false;
      actors.forEach((actor) => {
        parkActor(actor);
      });
    };

    const launchAll = () => {
      if (launched || actors.length === 0) return;
      launched = true;

      actors.forEach((actor, index) => {
        const layout = DROP_LAYOUTS[index % DROP_LAYOUTS.length];
        actor.mesh.position.set(layout.x, layout.y, layout.z);
        actor.mesh.rotation.set(Math.random() * 1.3, Math.random() * 1.3, Math.random() * 1.3);
        actor.velocity.set(layout.vx, layout.vy, layout.vz);
        actor.rotationVelocity.set(
          (Math.random() - 0.5) * actor.spin,
          (Math.random() - 0.5) * actor.spin,
          (Math.random() - 0.5) * actor.spin
        );
        actor.active = true;
        actor.settled = false;
      });
    };

    apiRef.current.launchAll = launchAll;
    apiRef.current.resetAll = resetAll;

    resize();
    window.addEventListener("resize", resize);

    Promise.all(
      MODEL_SET.map(
        (config) =>
          new Promise((resolve, reject) => {
            loader.load(
              config.path,
              (gltf) => resolve({ scene: gltf.scene, config }),
              undefined,
              reject
            );
          })
      )
    )
      .then((results) => {
        if (disposed) return;

        results.forEach(({ scene: modelScene, config }) => {
          const mesh = cloneRenderable(modelScene);
          mesh.scale.setScalar(config.scale);
          scene.add(mesh);

          const actor = {
            mesh,
            velocity: new THREE.Vector3(),
            rotationVelocity: new THREE.Vector3(),
            spin: config.spin,
            active: false,
            settled: false,
          };

          actors.push(actor);
          parkActor(actor);
        });
      })
      .catch(() => {});

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.033);

      if (visibleRef.current) {
        actors.forEach((actor) => {
          if (!actor.active || actor.settled) return;

          actor.velocity.y -= 15.5 * delta;
          actor.mesh.position.addScaledVector(actor.velocity, delta);
          actor.mesh.rotation.x += actor.rotationVelocity.x * delta;
          actor.mesh.rotation.y += actor.rotationVelocity.y * delta;
          actor.mesh.rotation.z += actor.rotationVelocity.z * delta;

          if (actor.mesh.position.y <= -1.92) {
            actor.mesh.position.y = -1.92;
            actor.velocity.y *= -0.24;
            actor.velocity.x *= 0.82;
            actor.velocity.z *= 0.82;
            actor.rotationVelocity.multiplyScalar(0.76);

            if (Math.abs(actor.velocity.y) < 0.11) {
              actor.velocity.set(0, 0, 0);
              actor.rotationVelocity.set(0, 0, 0);
              actor.settled = true;
            }
          }
        });
      }

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(tick);
    };

    tick();

    return () => {
      disposed = true;
      visibleRef.current = false;
      apiRef.current.launchAll = null;
      apiRef.current.resetAll = null;
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frameId);
      actors.forEach(({ mesh }) => {
        scene.remove(mesh);
      });
      renderer.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
    };
  }, [sectionRef, canvasRef]);
}
