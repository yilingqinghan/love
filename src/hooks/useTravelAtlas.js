import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sceneDistance, sceneScrub } from "../config/timing.js";
import { withBase } from "../utils/paths.js";

gsap.registerPlugin(ScrollTrigger);

const GLOBE_ASSETS = {
  bg: withBase("/assets/travel/globe/css_globe_bg.jpg"),
  diffuse: withBase("/assets/travel/globe/css_globe_diffuse.jpg"),
  halo: withBase("/assets/travel/globe/css_globe_halo.png"),
};

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function useTravelAtlas({ sectionRef, activePhoto, capturedCount, flashActive }) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const q = gsap.utils.selector(section);
    const linesViewport = section.querySelector(".travel-lines-viewport");
    const linesTrack = section.querySelector(".travel-lines-track");
    const worldBg = section.querySelector(".travel-world-bg");
    const globeSurface = section.querySelector(".travel-world-globe-surface");
    const globeHalo = section.querySelector(".travel-world-globe-halo");

    if (worldBg) worldBg.style.backgroundImage = `url(${GLOBE_ASSETS.bg})`;
    if (globeSurface) globeSurface.style.backgroundImage = `url(${GLOBE_ASSETS.diffuse})`;
    if (globeHalo) globeHalo.style.backgroundImage = `url(${GLOBE_ASSETS.halo})`;

    const ctx = gsap.context(() => {
      gsap.set(
        q(
          ".travel-line, .travel-polaroid, .travel-moment, .travel-landing, .travel-ticket-panel, .travel-camera-dock, .travel-stamp-rail, .travel-gallery-panel, .travel-gallery-copy, .travel-gallery-card"
        ),
        {
          autoAlpha: 0,
          y: 24,
        }
      );
      gsap.set(q(".travel-copy, .travel-world-shell"), { autoAlpha: 1, y: 0 });
      gsap.set(q(".travel-memory-ribbon"), { autoAlpha: 0, y: 14 });
      gsap.set(q(".travel-gallery-wall"), { xPercent: 2, yPercent: 0 });
      gsap.set(linesTrack, { y: 0 });

      q(".travel-polaroid").forEach((card) => {
        gsap.set(card, {
          autoAlpha: 0,
          x: -180 + Math.random() * 80,
          y: 140 + Math.random() * 110,
          rotate: -10 + Math.random() * 20,
          scale: 0.78,
        });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${sceneDistance("travelAtlas")}`,
          pin: true,
          scrub: sceneScrub(1),
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl
        .to(q(".travel-line"), { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.22, ease: "power3.out" }, 0.08)
        .to(
          linesTrack,
          {
            y: () => {
              if (!linesViewport || !linesTrack) return 0;
              return -Math.max(0, linesTrack.scrollHeight - linesViewport.clientHeight);
            },
            duration: 1.14,
            ease: "none",
          },
          0.32
        )
        .to(q(".travel-world-shell"), { scale: 1.02, duration: 0.25, ease: "power3.out" }, 0.13)
        .to(q(".travel-ticket-panel"), { autoAlpha: 1, y: 0, duration: 0.28, ease: "power3.out" }, 0.22)
        .to(q(".travel-camera-dock"), { autoAlpha: 1, y: 0, duration: 0.24, ease: "power3.out" }, 0.64);

      q(".travel-polaroid").forEach((card, index) => {
        const startAt = 0.98 + index * 0.11;
        tl.to(
          card,
          {
            autoAlpha: 0.76,
            x: 0,
            y: 0,
            rotate: card.style.getPropertyValue("--photo-r"),
            scale: 1,
            duration: 0.24,
            ease: "power3.out",
          },
          startAt
        );
      });

      tl
        .to(q(".travel-memory-ribbon"), { autoAlpha: 1, y: 0, duration: 0.2, ease: "power3.out" }, 1.12)
        .to(q(".travel-stamp-rail"), { autoAlpha: 1, y: 0, duration: 0.22, ease: "power3.out" }, 1.22)
        .to(q(".travel-moment"), { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.16, ease: "power3.out" }, 1.3)
        .to(q(".travel-landing"), { autoAlpha: 1, y: 0, duration: 0.22, ease: "power3.out" }, 1.4)
        .to(
          q(".travel-ticket-panel, .travel-camera-dock, .travel-polaroid, .travel-stamp-rail, .travel-moments, .travel-landing, .travel-world-shell"),
          {
            autoAlpha: 0,
            y: -18,
            duration: 0.34,
            ease: "power2.out",
          },
          1.7
        )
        .to(q(".travel-copy"), { autoAlpha: 0, y: -18, duration: 0.3, ease: "power2.out" }, 1.76)
        .to(q(".travel-gallery-panel"), { autoAlpha: 1, y: 0, duration: 0.22, ease: "power3.out" }, 1.86)
        .to(q(".travel-gallery-copy"), { autoAlpha: 1, y: 0, duration: 0.22, ease: "power3.out" }, 1.92)
        .to(q(".travel-gallery-card"), { autoAlpha: 1, y: 0, stagger: 0.012, duration: 0.24, ease: "power2.out" }, 2.0)
        .to(
          q(".travel-gallery-wall"),
          {
            xPercent: -18,
            yPercent: -1.4,
            duration: 1.28,
            ease: "none",
          },
          2.06
        );
    }, section);

    return () => ctx.revert();
  }, [sectionRef]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !activePhoto) return undefined;

    const cards = Array.from(section.querySelectorAll(".travel-polaroid"));
    const globe = section.querySelector(".travel-world-globe");
    const globeSurface = section.querySelector(".travel-world-globe-surface");
    const globeHalo = section.querySelector(".travel-world-globe-halo");

    const targetTiltX = clamp(-Number(activePhoto.lat) * 0.18, -12, 12);
    const targetTiltY = clamp(Number(activePhoto.lng) * 0.09, -16, 16);

    cards.forEach((card) => {
      const isActive = card.classList.contains("is-active");
      gsap.to(card, {
        autoAlpha: isActive ? 1 : card.classList.contains("is-captured") ? 0.58 : 0.34,
        scale: isActive ? 1.04 : 0.98,
        y: isActive ? -8 : 0,
        duration: 0.5,
        ease: "power3.out",
      });
    });

    if (globe) {
      gsap.to(globe, {
        rotateX: targetTiltX,
        rotateY: targetTiltY,
        duration: 1.1,
        ease: "power3.out",
      });
    }

    if (globeHalo) {
      gsap.fromTo(
        globeHalo,
        { opacity: 0.42, scale: 0.98 },
        { opacity: 0.62, scale: 1.03, duration: 0.46, yoyo: true, repeat: 1, ease: "power2.out" }
      );
    }

    return undefined;
  }, [activePhoto, sectionRef]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const globe = section.querySelector(".travel-world-globe");
    const globeSurface = section.querySelector(".travel-world-globe-surface");
    if (!globe || !globeSurface) return undefined;

    const drift = gsap.to(globeSurface, {
      backgroundPositionX: "-=720px",
      duration: 18,
      ease: "none",
      repeat: -1,
    });

    return () => {
      drift.kill();
    };
  }, [sectionRef]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const stamps = section.querySelectorAll(".travel-stamp");
    const camera = section.querySelector(".travel-camera-button");
    if (camera) {
      gsap.fromTo(camera, { scale: 1 }, { scale: 1.03, duration: 0.24, yoyo: true, repeat: 1, ease: "power2.out" });
    }

    if (stamps.length > 0) {
      gsap.fromTo(
        stamps[stamps.length - 1],
        { autoAlpha: 0, scale: 0.7, rotate: -8 },
        { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.42, ease: "back.out(1.4)" }
      );
    }

    return undefined;
  }, [capturedCount, sectionRef]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !flashActive) return undefined;

    const flash = section.querySelector(".travel-camera-flash");
    if (!flash) return undefined;

    gsap.fromTo(
      flash,
      { autoAlpha: 0.82 },
      { autoAlpha: 0, duration: 0.42, ease: "power2.out", overwrite: true }
    );

    return undefined;
  }, [flashActive, sectionRef]);
}
