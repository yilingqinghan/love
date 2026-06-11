import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useParallelAscent({ sectionRef, ready }) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !ready) return undefined;

    const svg = section.querySelector("svg");
    const stage = section.querySelector(".parallel-ascent-stage");
    const scrollEl = section.querySelector(".parallel-scroll-element");
    const collisionCanvas = section.querySelector(".parallel-collision-canvas");
    const fireworksCanvas = section.querySelector(".parallel-fireworks-canvas");
    const linesViewport = section.querySelector(".parallel-ascent-lines-viewport");
    const linesTrack = section.querySelector(".parallel-ascent-lines-track");
    if (!svg || !stage || !scrollEl || !collisionCanvas || !fireworksCanvas) return undefined;

    const speed = 100;
    const height = svg.getBBox().height;
    const collisionFx = createCollisionEffect(collisionCanvas, stage);
    const fireworksFx = createFireworksEffect(fireworksCanvas, stage);

    const ctx = gsap.context(() => {
      gsap.set("#h2-1", { opacity: 0 });
      gsap.set("#bg_grad", { attr: { cy: "-50" } });
      gsap.set(["#dinoL", "#dinoR"], { y: 80 });
      gsap.set("#dinoL", { x: -10 });
      gsap.set(".parallel-ascent-svg", { filter: "blur(0px) brightness(1)", scale: 1, transformOrigin: "50% 50%" });
      gsap.set(".parallel-collision-canvas", { autoAlpha: 0 });
      gsap.set(".parallel-fireworks-canvas", { autoAlpha: 0 });
      gsap.set(".parallel-ascent-title", { autoAlpha: 0, y: 60 });
      gsap.set(".parallel-panel-left", { autoAlpha: 0, x: -90, y: 20 });
      gsap.set(".parallel-panel-right", { autoAlpha: 0, x: 90, y: 20 });
      gsap.set(".parallel-axis", { autoAlpha: 0, y: 40, scale: 0.94, transformOrigin: "50% 50%" });
      gsap.set(".parallel-ascent-lines p", { autoAlpha: 0, y: 24 });
      gsap.set(linesTrack, { y: 0 });
      gsap.set(".parallel-ascent-haze", { autoAlpha: 0 });

      const mm = gsap.matchMedia();
      mm.add("(max-width: 1922px)", () => {
        gsap.set(["#cloudStart-L", "#cloudStart-R"], { x: 10, opacity: 1 });
      });

      ScrollTrigger.create({
        trigger: scrollEl,
        start: "top top",
        end: "bottom bottom",
        pin: stage,
        pinSpacing: false,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });

      if (linesViewport && linesTrack) {
        gsap.to(linesTrack, {
          y: () => -Math.max(0, linesTrack.scrollHeight - linesViewport.clientHeight),
          ease: "none",
          scrollTrigger: {
            trigger: scrollEl,
            start: "58% top",
            end: "bottom bottom",
            scrub: 0.9,
            invalidateOnRefresh: true,
          },
        });
      }

      const scene1 = gsap.timeline();
      ScrollTrigger.create({
        animation: scene1,
        trigger: scrollEl,
        start: "top top",
        end: "36% 100%",
        scrub: 1.25,
      });

      scene1.to("#h1-1", { y: 3 * speed, x: 1 * speed, scale: 0.9, ease: "power1.in" }, 0);
      scene1.to("#h1-2", { y: 2.6 * speed, x: -0.6 * speed, ease: "power1.in" }, 0);
      scene1.to("#h1-3", { y: 1.7 * speed, x: 1.2 * speed }, 0.03);
      scene1.to("#h1-4", { y: 3 * speed, x: 1 * speed }, 0.03);
      scene1.to("#h1-5", { y: 2 * speed, x: 1 * speed }, 0.03);
      scene1.to("#h1-6", { y: 2.3 * speed, x: -2.5 * speed }, 0);
      scene1.to("#h1-7", { y: 5 * speed, x: 1.6 * speed }, 0);
      scene1.to("#h1-8", { y: 3.5 * speed, x: 0.2 * speed }, 0);
      scene1.to("#h1-9", { y: 3.5 * speed, x: -0.2 * speed }, 0);
      scene1.to("#cloudsBig-L", { y: 4.5 * speed, x: -0.2 * speed }, 0);
      scene1.to("#cloudsBig-R", { y: 4.5 * speed, x: -0.2 * speed }, 0);
      scene1.to("#cloudStart-L", { x: -300 }, 0);
      scene1.to("#cloudStart-R", { x: 300 }, 0);
      scene1.to("#info", { y: 8 * speed }, 0);

      gsap.fromTo(
        "#bird",
        { opacity: 1 },
        {
          y: -250,
          x: 800,
          ease: "power2.out",
          scrollTrigger: {
            trigger: scrollEl,
            start: "15% top",
            end: "48% 100%",
            scrub: 1.3,
            onEnter: function () {
              gsap.to("#bird", { scaleX: 1, rotation: 0 });
            },
            onLeave: function () {
              gsap.to("#bird", { scaleX: -1, rotation: -15 });
            },
          },
        }
      );

      const clouds = gsap.timeline();
      ScrollTrigger.create({
        animation: clouds,
        trigger: scrollEl,
        start: "top top",
        end: "52% 100%",
        scrub: 0.75,
      });

      clouds.to("#cloud1", { x: 500 }, 0);
      clouds.to("#cloud2", { x: 1000 }, 0);
      clouds.to("#cloud3", { x: -1000 }, 0);
      clouds.to("#cloud4", { x: -700, y: 25 }, 0);

      const sun = gsap.timeline();
      ScrollTrigger.create({
        animation: sun,
        trigger: scrollEl,
        start: "1% top",
        end: "1650 100%",
        scrub: 0.9,
      });

      sun.fromTo("#bg_grad", { attr: { cy: "-50" } }, { attr: { cy: "330" } }, 0);
      sun.to("#bg_grad stop:nth-child(2)", { attr: { offset: "0.15" } }, 0);
      sun.to("#bg_grad stop:nth-child(3)", { attr: { offset: "0.18" } }, 0);
      sun.to("#bg_grad stop:nth-child(4)", { attr: { offset: "0.25" } }, 0);
      sun.to("#bg_grad stop:nth-child(5)", { attr: { offset: "0.46" } }, 0);
      sun.to("#bg_grad stop:nth-child(6)", { attr: { "stop-color": "#FF9171" } }, 0);

      const scene2 = gsap.timeline();
      ScrollTrigger.create({
        animation: scene2,
        trigger: scrollEl,
        start: "15% top",
        end: "33% 100%",
        scrub: 1.1,
      });

      scene2.fromTo("#h2-1", { y: 500, opacity: 0 }, { y: 0, opacity: 1 }, 0);
      scene2.fromTo("#h2-2", { y: 500 }, { y: 0 }, 0.1);
      scene2.fromTo("#h2-3", { y: 700 }, { y: 0 }, 0.1);
      scene2.fromTo("#h2-4", { y: 700 }, { y: 0 }, 0.2);
      scene2.fromTo("#h2-5", { y: 800 }, { y: 0 }, 0.3);
      scene2.fromTo("#h2-6", { y: 900 }, { y: 0 }, 0.3);

      gsap.set("#bats", { transformOrigin: "50% 50%" });
      gsap.fromTo(
        "#bats",
        { opacity: 1, y: 400, scale: 0 },
        {
          y: 20,
          scale: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: scrollEl,
            start: "40% top",
            end: "52% 100%",
            scrub: 1,
            onEnter: function () {
              gsap.utils.toArray("#bats path").forEach((item, i) => {
                gsap.to(item, {
                  scaleX: 0.5,
                  yoyo: true,
                  repeat: 9,
                  transformOrigin: "50% 50%",
                  duration: 0.15,
                  delay: 0.7 + i / 10,
                });
              });
              gsap.set("#bats", { opacity: 1 });
            },
          },
        }
      );

      const sun2 = gsap.timeline();
      ScrollTrigger.create({
        animation: sun2,
        trigger: scrollEl,
        start: "1550 top",
        end: "3900 100%",
        scrub: 1,
      });

      sun2.to("#sun", { attr: { offset: "1.4" } }, 0);
      sun2.to("#bg_grad stop:nth-child(2)", { attr: { offset: "0.7" } }, 0);
      sun2.to("#sun", { attr: { "stop-color": "#ffff00" } }, 0);
      sun2.to("#lg4 stop:nth-child(1)", { attr: { "stop-color": "#623951" } }, 0);
      sun2.to("#lg4 stop:nth-child(2)", { attr: { "stop-color": "#261F36" } }, 0);
      sun2.to("#bg_grad stop:nth-child(6)", { attr: { "stop-color": "#45224A" } }, 0);

      gsap.set("#scene3", { y: height - 40, visibility: "visible" });
      const sceneTransition = gsap.timeline();
      ScrollTrigger.create({
        animation: sceneTransition,
        trigger: scrollEl,
        start: "50% top",
        end: "bottom 100%",
        scrub: 1.1,
      });

      sceneTransition.to("#h2-1", { y: -height - 100, scale: 1.5, transformOrigin: "50% 50%" }, 0);
      sceneTransition.to("#bg_grad", { attr: { cy: "-80" } }, 0);
      sceneTransition.to("#bg2", { y: 0 }, 0);

      const scene3 = gsap.timeline();
      ScrollTrigger.create({
        animation: scene3,
        trigger: scrollEl,
        start: "58% 50%",
        end: "bottom 100%",
        scrub: 1.1,
      });

      scene3.fromTo("#h3-1", { y: 300 }, { y: -550 }, 0);
      scene3.fromTo("#h3-2", { y: 800 }, { y: -550 }, 0.03);
      scene3.fromTo("#h3-3", { y: 600 }, { y: -550 }, 0.06);
      scene3.fromTo("#h3-4", { y: 800 }, { y: -550 }, 0.09);
      scene3.fromTo("#h3-5", { y: 1000 }, { y: -550 }, 0.12);
      scene3.fromTo("#stars", { opacity: 0 }, { opacity: 0.5, y: -500 }, 0);
      scene3.fromTo("#arrow2", { opacity: 0 }, { opacity: 0.7, y: -710 }, 0.25);
      scene3.fromTo("#text2", { opacity: 0 }, { opacity: 0.7, y: -710 }, 0.3);
      scene3.to("#bg2-grad", { attr: { cy: 600 } }, 0);
      scene3.to("#bg2-grad", { attr: { r: 500 } }, 0);

      gsap.set("#fstar", { y: -400 });
      const fstarTL = gsap.timeline();
      ScrollTrigger.create({
        animation: fstarTL,
        trigger: scrollEl,
        start: "3000 top",
        end: "4700 bottom",
        scrub: 1,
        onEnter: function () {
          gsap.set("#fstar", { opacity: 1 });
        },
        onLeave: function () {
          gsap.set("#fstar", { opacity: 0 });
        },
      });

      fstarTL.to("#fstar", { x: -700, y: -250, ease: "power2.out" }, 0);

      [
        1, 3, 5, 8, 11, 15, 17, 18, 25, 28, 30, 35, 40, 45, 48,
      ].forEach((n, index) => {
        gsap.fromTo(
          `#stars path:nth-of-type(${n})`,
          { opacity: 0.3 },
          { opacity: 1, duration: 0.3, repeat: -1, repeatDelay: [0.8, 1.8, 1, 1.2, 0.5, 2, 1.1, 1.4, 1.1, 0.9, 1.3, 2, 0.8, 1.8, 1][index] }
        );
      });

      const narrativeTL = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: scrollEl,
          start: "54% top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
          onEnter: () => {
            collisionFx.reset();
            fireworksFx.reset();
            collisionFx.start();
            fireworksFx.stop();
          },
          onEnterBack: () => {
            collisionFx.reset();
            fireworksFx.reset();
            collisionFx.start();
            fireworksFx.stop();
          },
          onLeaveBack: () => {
            resetNarrative();
          },
        },
      });
      narrativeTL
        .set(".parallel-collision-canvas", { autoAlpha: 1 })
        .call(() => {
          fireworksFx.stop();
          collisionFx.start();
        })
        .to(".parallel-ascent-svg", { filter: "blur(10px) brightness(0.78)", scale: 1.035, duration: 0.18 }, 0.06)
        .to(".parallel-ascent-haze", { autoAlpha: 1, duration: 0.16 }, 0.08)
        .to(".parallel-collision-canvas", { autoAlpha: 0.18, duration: 0.16 }, 0.12)
        .to(".parallel-ascent-title", { autoAlpha: 1, y: 0, duration: 0.18 }, 0.2)
        .to(".parallel-panel-left", { autoAlpha: 1, x: 0, y: 0, duration: 0.18 }, 0.32)
        .to(".parallel-panel-right", { autoAlpha: 1, x: 0, y: 0, duration: 0.18 }, 0.38)
        .to(".parallel-axis", { autoAlpha: 1, y: 0, scale: 1, duration: 0.18 }, 0.48)
        .to(".parallel-ascent-lines p", { autoAlpha: 1, y: 0, stagger: 0.16, duration: 0.22 }, 0.56)
        .to(".parallel-fireworks-canvas", { autoAlpha: 1, duration: 0.18 }, 0.92)
        .call(() => {
          collisionFx.fadeOut();
          fireworksFx.start(4200);
        }, null, 0.92);

      function resetNarrative() {
        narrativeTL.pause(0);
        collisionFx.reset();
        fireworksFx.reset();
        gsap.set(".parallel-ascent-svg", {
          filter: "blur(0px) brightness(1)",
          scale: 1,
        });
        gsap.set(".parallel-collision-canvas", { autoAlpha: 0 });
        gsap.set(".parallel-fireworks-canvas", { autoAlpha: 0 });
        gsap.set(".parallel-ascent-title", { autoAlpha: 0, y: 60 });
        gsap.set(".parallel-panel-left", { autoAlpha: 0, x: -90, y: 20 });
        gsap.set(".parallel-panel-right", { autoAlpha: 0, x: 90, y: 20 });
        gsap.set(".parallel-axis", { autoAlpha: 0, y: 40, scale: 0.94 });
        gsap.set(".parallel-ascent-lines p", { autoAlpha: 0, y: 24 });
        gsap.set(linesTrack, { y: 0 });
        gsap.set(".parallel-ascent-haze", { autoAlpha: 0 });
      }
    }, section);

    return () => {
      collisionFx.destroy();
      fireworksFx.destroy();
      ctx.revert();
    };
  }, [sectionRef, ready]);
}

function createCollisionEffect(canvas, stage) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      start() {},
      fadeOut() {},
      stop() {},
      reset() {},
      destroy() {},
    };
  }

  const max = 200;
  const particles = [];
  const spawnTimers = [];
  const point = { x: 0, y: 0 };
  let rafId = 0;
  let running = false;
  let width = 0;
  let height = 0;
  let hue = 0;
  let fadeTimer = 0;

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    point.x = width / 2;
    point.y = height / 2;
  }

  function createParticle() {
    return {
      init() {
        this.hue = hue;
        this.alpha = 0;
        this.size = this.random(1, 5);
        this.x = this.random(0, width);
        this.y = this.random(0, height);
        this.velocity = this.size * 0.5;
        this.changed = null;
        this.changedFrame = 0;
        this.maxChangedFrames = 50;
        return this;
      },
      update() {
        if (this.changed) {
          this.alpha *= 0.92;
          this.size += 2;
          this.changedFrame += 1;
          if (this.changedFrame > this.maxChangedFrames) {
            this.init();
          }
          return;
        }

        if (this.distance(point.x, point.y) < 50) {
          this.changed = true;
          return;
        }

        const dx = point.x - this.x;
        const dy = point.y - this.y;
        const angle = Math.atan2(dy, dx);
        this.alpha += 0.01;
        this.x += this.velocity * Math.cos(angle);
        this.y += this.velocity * Math.sin(angle);
        this.velocity += 0.02;
      },
      draw() {
        ctx.strokeStyle = `hsla(${this.hue}, 100%, 50%, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
        this.update();
      },
      distance(x, y) {
        return Math.hypot(x - this.x, y - this.y);
      },
      random(min, maxValue) {
        return Math.random() * (maxValue - min) + min;
      },
    };
  }

  function tick() {
    if (!running) return;
    ctx.fillStyle = "rgba(0,0,0,.2)";
    ctx.fillRect(0, 0, width, height);
    particles.forEach((particle) => particle.draw());
    hue += 0.3;
    rafId = window.requestAnimationFrame(tick);
  }

  function populate() {
    particles.length = 0;
    for (let index = 0; index < max; index += 1) {
      const timer = window.setTimeout(() => {
        if (!running) return;
        particles.push(createParticle().init());
      }, index * 10);
      spawnTimers.push(timer);
    }
  }

  function start() {
    resize();
    if (running) return;
    ctx.clearRect(0, 0, width, height);
    running = true;
    populate();
    tick();
  }

  function fadeOut() {
    gsap.to(canvas, { autoAlpha: 0.12, duration: 1.2, overwrite: true });
    window.clearTimeout(fadeTimer);
    fadeTimer = window.setTimeout(() => {
      if (running) stop();
    }, 1400);
  }

  function stop() {
    running = false;
    window.cancelAnimationFrame(rafId);
    window.clearTimeout(fadeTimer);
    spawnTimers.splice(0).forEach((timer) => window.clearTimeout(timer));
    particles.length = 0;
    ctx.clearRect(0, 0, width, height);
  }

  function reset() {
    hue = 0;
    gsap.set(canvas, { autoAlpha: 1 });
    stop();
  }

  function destroy() {
    window.removeEventListener("resize", resize);
    reset();
  }

  window.addEventListener("resize", resize);
  resize();

  return {
    start,
    fadeOut,
    stop,
    reset,
    destroy,
  };
}

function createFireworksEffect(canvas, stage) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      start() {},
      stop() {},
      reset() {},
      destroy() {},
    };
  }

  const listFire = [];
  const listFirework = [];
  const fireNumber = 10;
  const center = { x: 0, y: 0 };
  const range = 100;
  let rafId = 0;
  let running = false;
  let stopTimer = 0;
  let width = 0;
  let height = 0;

  function resize() {
    const rect = stage.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    center.x = width / 2;
    center.y = height / 2;
    ctx.clearRect(0, 0, width, height);
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randColor() {
    const palette = [
      [255, 213, 128],
      [255, 154, 139],
      [192, 170, 255],
      [120, 230, 255],
      [255, 244, 164],
    ];
    const [r, g, b] = palette[Math.floor(Math.random() * palette.length)];
    return `rgb(${r}, ${g}, ${b})`;
  }

  function setupFireworks() {
    listFire.length = 0;
    listFirework.length = 0;
    for (let index = 0; index < fireNumber; index += 1) {
      const fire = {
        x: Math.random() * range / 2 - range / 4 + center.x,
        y: Math.random() * range * 2 + height,
        size: Math.random() + 0.5,
        fill: "#fd1",
        vx: Math.random() - 0.5,
        vy: -(Math.random() + 4),
        ax: Math.random() * 0.02 - 0.01,
        far: Math.random() * range + (center.y - range),
      };
      fire.base = {
        x: fire.x,
        y: fire.y,
        vx: fire.vx,
      };
      listFire.push(fire);
    }
  }

  function update() {
    for (let index = 0; index < listFire.length; index += 1) {
      const fire = listFire[index];
      if (fire.y <= fire.far) {
        const color = randColor();
        for (let i = 0; i < fireNumber * 5; i += 1) {
          const firework = {
            x: fire.x,
            y: fire.y,
            size: Math.random() + 1.5,
            fill: color,
            vx: Math.random() * 5 - 2.5,
            vy: Math.random() * -5 + 1.5,
            ay: 0.05,
            alpha: 1,
            life: Math.round(Math.random() * range / 2) + range / 2,
          };
          firework.base = {
            life: firework.life,
            size: firework.size,
          };
          listFirework.push(firework);
        }
        fire.y = fire.base.y;
        fire.x = fire.base.x;
        fire.vx = fire.base.vx;
        fire.ax = Math.random() * 0.02 - 0.01;
      }

      fire.x += fire.vx;
      fire.y += fire.vy;
      fire.vx += fire.ax;
    }

    for (let index = listFirework.length - 1; index >= 0; index -= 1) {
      const firework = listFirework[index];
      firework.x += firework.vx;
      firework.y += firework.vy;
      firework.vy += firework.ay;
      firework.alpha = firework.life / firework.base.life;
      firework.size = firework.alpha * firework.base.size;
      firework.alpha = firework.alpha > 0.6 ? 1 : firework.alpha;
      firework.life -= 1;
      if (firework.life <= 0) {
        listFirework.splice(index, 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 1;
    for (let index = 0; index < listFire.length; index += 1) {
      const fire = listFire[index];
      ctx.beginPath();
      ctx.arc(fire.x, fire.y, fire.size, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = fire.fill;
      ctx.fill();
    }

    for (let index = 0; index < listFirework.length; index += 1) {
      const firework = listFirework[index];
      ctx.globalAlpha = firework.alpha;
      ctx.beginPath();
      ctx.arc(firework.x, firework.y, firework.size, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = firework.fill;
      ctx.fill();
    }
  }

  function tick() {
    if (!running) return;
    update();
    draw();
    rafId = window.requestAnimationFrame(tick);
  }

  function start(duration = 4200) {
    resize();
    if (running) return;
    setupFireworks();
    running = true;
    tick();
    stopTimer = window.setTimeout(() => {
      stop();
    }, duration);
  }

  function stop() {
    running = false;
    window.cancelAnimationFrame(rafId);
    window.clearTimeout(stopTimer);
    listFire.length = 0;
    listFirework.length = 0;
    ctx.clearRect(0, 0, width, height);
  }

  function reset() {
    stop();
  }

  function destroy() {
    window.removeEventListener("resize", resize);
    reset();
  }

  window.addEventListener("resize", resize);
  resize();

  return {
    start,
    stop,
    reset,
    destroy,
  };
}
