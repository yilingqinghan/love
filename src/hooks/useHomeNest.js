import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { sceneDistance, sceneScrub } from "../config/timing.js";

gsap.registerPlugin(ScrollTrigger);

export function useHomeNest({ sectionRef }) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const q = gsap.utils.selector(section);
    const livingFrame = section.querySelector(".home-living-frame");
    const afterglowViewport = section.querySelector(".home-afterglow-viewport");
    const afterglowTrack = section.querySelector(".home-afterglow-track");

    const ctx = gsap.context(() => {
      gsap.set(q(".home-living-frame, .home-room-stage, .home-afterglow-line"), {
        autoAlpha: 0,
        y: 36,
      });

      gsap.set(q(".home-living-frame"), {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
      });

      gsap.set(q(".home-room-stage"), {
        scale: 0.96,
      });
      gsap.set(afterglowTrack, { y: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${sceneDistance("homeNest")}`,
          pin: true,
          scrub: sceneScrub(1),
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl
        .to(q(".home-living-frame"), {
          autoAlpha: 1,
          y: 0,
          duration: 0.08,
        }, 0)
        .to(q(".home-living-frame"), {
          scale: 1.08,
          y: -42,
          filter: "blur(10px)",
          autoAlpha: 0,
          duration: 0.24,
          ease: "power2.out",
        }, 0.22)
        .to(q(".home-room-stage.s1"), {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.2,
          ease: "power3.out",
        }, 0.34)
        .to(q(".home-room-stage.s1"), {
          autoAlpha: 0,
          scale: 1.04,
          duration: 0.12,
          ease: "power2.inOut",
        }, 0.52)
        .to(q(".home-room-stage.s2"), {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.2,
          ease: "power3.out",
        }, 0.54)
        .to(q(".home-room-stage.s2"), {
          autoAlpha: 0,
          scale: 1.04,
          duration: 0.12,
          ease: "power2.inOut",
        }, 0.72)
        .to(q(".home-room-stage.s3"), {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.22,
          ease: "power3.out",
        }, 0.74)
        .to(q(".home-afterglow"), {
          autoAlpha: 1,
          duration: 0.16,
          ease: "power2.out",
        }, 0.88)
        .to(q(".home-afterglow-line"), {
          autoAlpha: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.18,
          ease: "power3.out",
        }, 0.9)
        .to(
          afterglowTrack,
          {
            y: () => {
              if (!afterglowViewport || !afterglowTrack) return 0;
              return -Math.max(0, afterglowTrack.scrollHeight - afterglowViewport.clientHeight);
            },
            duration: 0.58,
            ease: "none",
          },
          0.96
        );
    }, section);

    const normalizeLivingFrame = () => {
      const doc = livingFrame?.contentDocument;
      if (!doc) return;

      const html = doc.documentElement;
      const body = doc.body;
      if (!html || !body) return;

      Object.assign(html.style, {
        width: "100%",
        height: "100%",
        margin: "0",
        overflow: "hidden",
        background: "transparent",
      });

      Object.assign(body.style, {
        width: "100vw",
        height: "100vh",
        margin: "0",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        background: "transparent",
      });

      const fullContainer = doc.querySelector(".container-full");
      const content = doc.querySelector(".content");
      const rootContainer = doc.querySelector(".container");
      const backgroundImage = doc.querySelector(".backgroundImage");
      const boyImage = doc.querySelector(".boyImage");

      [fullContainer, content].forEach((node) => {
        if (!node) return;
        Object.assign(node.style, {
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        });
      });

      if (rootContainer) {
        Object.assign(rootContainer.style, {
          width: "100vw",
          height: "100vh",
          display: "grid",
          placeItems: "center",
        });
      }

      [backgroundImage, boyImage].forEach((node) => {
        if (!node) return;
        Object.assign(node.style, {
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          left: "0",
          top: "0",
        });
      });
    };

    if (livingFrame) {
      livingFrame.addEventListener("load", normalizeLivingFrame);
      if (livingFrame.contentDocument?.readyState === "complete") {
        normalizeLivingFrame();
      }
    }

    const roomFrames = Array.from(section.querySelectorAll(".home-room-embed"));
    const detachLoadHandlers = roomFrames.map((frame) => {
      const normalizeFrame = () => {
        const doc = frame.contentDocument;
        if (!doc) return;

        const html = doc.documentElement;
        const body = doc.body;
        if (!html || !body) return;

        Object.assign(html.style, {
          width: "100%",
          height: "100%",
          margin: "0",
          overflow: "hidden",
          background: "transparent",
        });

        Object.assign(body.style, {
          width: "100%",
          height: "100%",
          margin: "0",
          overflow: "hidden",
          background: "transparent",
        });

        const studioWrapper = doc.querySelector(".scene__wrapper");
        const studioScene = doc.querySelector(".scene");
        if (studioWrapper && studioScene) {
          Object.assign(body.style, {
            display: "grid",
            placeItems: "center",
            minHeight: "100vh",
          });
          Object.assign(studioWrapper.style, {
            width: "100vw",
            height: "100vh",
            overflow: "hidden",
            position: "relative",
            display: "grid",
            placeItems: "center",
          });
          Object.assign(studioScene.style, {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "translate(-50%, -50%) scale(0.82) translate3d(0, 0, 50vmin)",
            transformOrigin: "50% 50%",
          });
        }

        const webglCanvas = doc.querySelector(".webgl");
        if (webglCanvas) {
          Object.assign(body.style, {
            display: "block",
            minHeight: "100vh",
          });
          Object.assign(webglCanvas.style, {
            position: "absolute",
            inset: "0",
            width: "100vw",
            height: "100vh",
            display: "block",
          });
        }

        const pureHouse = doc.querySelector(".house");
        if (pureHouse) {
          Object.assign(body.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          });
          Object.assign(pureHouse.style, {
            left: "50%",
            top: "52%",
            transform: "translate(-50%, -50%) scale(1.9) perspective(90vw) rotateX(75deg) rotateZ(45deg) translateZ(-9vw)",
          });
        }
      };

      frame.addEventListener("load", normalizeFrame);
      if (frame.contentDocument?.readyState === "complete") {
        normalizeFrame();
      }

      return () => frame.removeEventListener("load", normalizeFrame);
    });

    return () => {
      if (livingFrame) {
        livingFrame.removeEventListener("load", normalizeLivingFrame);
      }
      detachLoadHandlers.forEach((detach) => detach());
      ctx.revert();
    };
  }, [sectionRef]);
}
