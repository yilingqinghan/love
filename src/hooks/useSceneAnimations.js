import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useSceneAnimations({ refs, bootMessages, setBootLines }) {
  useEffect(() => {
    const { bootRef, heroRef, timelineRef, worldRef } = refs;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = new Set();
    let index = 0;

    const schedule = (callback, delay) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
      return timer;
    };

    /*
      第一幕：Boot Sequence
      ------------------------------------------------------------
      这里故意做得更像电影黑客屏幕：
      - 日志行数更多；
      - 节奏更快；
      - 最后停顿一小下再裂开。
      如果想继续加压迫感，优先调打印间隔和 onComplete 前 delay。
    */
    const printNextBootLine = () => {
      setBootLines(bootMessages.slice(0, index + 1));
      index += 1;

      if (index < bootMessages.length) {
        schedule(printNextBootLine, reduceMotion ? 70 : 148);
        return;
      }

      const bootTl = gsap.timeline({
        delay: reduceMotion ? 0.1 : 0.72,
        defaults: { ease: "power3.out" },
        onComplete: () => {
          document.body.classList.remove("boot-lock");
          window.dispatchEvent(new Event("love:boot-unlocked"));
        },
      });

      bootTl
        .to(".boot-console", {
          autoAlpha: 0,
          y: -10,
          duration: reduceMotion ? 0.1 : 0.34,
        })
        .to(
          ".boot-panel.left",
          {
            xPercent: -103,
            duration: reduceMotion ? 0.1 : 0.82,
            ease: "power3.inOut",
          },
          "<"
        )
        .to(
          ".boot-panel.right",
          {
            xPercent: 103,
            duration: reduceMotion ? 0.1 : 0.82,
            ease: "power3.inOut",
          },
          "<"
        )
        .to(bootRef.current, {
          autoAlpha: 0,
          duration: 0.22,
          pointerEvents: "none",
        });
    };

    schedule(printNextBootLine, reduceMotion ? 70 : 150);

    const ctx = gsap.context(() => {
      /*
        Hero 轻微视差：
        ------------------------------------------------------------
        只让背景做非常克制的 scale/y 位移，避免廉价特效感。
      */
      gsap.to(".hero-bg", {
        yPercent: 9,
        scale: 1.1,
        opacity: 0.26,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
        },
      });

      gsap.to(".hero-content", {
        yPercent: -12,
        opacity: 0,
        filter: "blur(10px)",
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.9,
        },
      });

      /*
        第二幕：3 Days Timeline
        ------------------------------------------------------------
        1. timeline-bg 使用 ScrollTrigger scrub 做慢速背景移动，形成视差。
        2. 每个节点进入视口时 fade in up。
        3. onEnter / onEnterBack 给当前节点加 active 类，并用 GSAP 做一次柔和 pulse。
        你可以通过 start/end 调整“什么时候开始亮起”。
      */
      if (timelineRef?.current) {
        gsap.to(".timeline-bg", {
          yPercent: -16,
          ease: "none",
          scrollTrigger: {
            trigger: timelineRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.15,
          },
        });

        gsap.utils.toArray(".timeline-item").forEach((item) => {
          const activate = () => {
            document.querySelectorAll(".timeline-item").forEach((node) => {
              node.classList.remove("active");
            });
            item.classList.add("active");
            gsap.fromTo(
              item,
              { filter: "drop-shadow(0 0 0 rgba(216,255,240,0))", scale: 1 },
              {
                filter: "drop-shadow(0 0 22px rgba(216,255,240,0.22))",
                scale: 1.025,
                yoyo: true,
                repeat: 1,
                duration: 0.48,
                ease: "power3.out",
              }
            );
          };

          gsap.fromTo(
            item,
            { autoAlpha: 0, y: 80 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: item,
                start: "top 78%",
                end: "bottom 45%",
                toggleActions: "play none none reverse",
                onEnter: activate,
                onEnterBack: activate,
              },
            }
          );
        });
      }

      /*
        第三幕：世界观重合
        ------------------------------------------------------------
        pin: true 会把整屏固定住，让用户滚动时动画在同一屏内完成。
        scrub: 1.2 表示滚动进度与动画进度绑定，并带一点延迟，手感更柔。
        invalidateOnRefresh: true 可以在窗口尺寸变化后重新计算 x 位移。

        汇聚逻辑：
        - 左侧 C++ / LLVM / RISC-V 片段向右移动到中心附近。
        - 右侧 CAFA / 法条 / 色彩片段向左移动到中心附近。
        - 同时逐渐降低碎片透明度，中心的 ∞ 符号描边被“画出来”。
      */
      if (worldRef?.current) {
        const worldTl = gsap.timeline({
          scrollTrigger: {
            trigger: worldRef.current,
            start: "top top",
            end: "+=1500",
            pin: true,
            scrub: 1.2,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        worldTl
          .to(
            ".world-left .world-fragment",
            {
              x: () => window.innerWidth * 0.34,
              y: (i) => [-40, -10, 28, 10][i] || 0,
              opacity: 0.36,
              filter: "blur(0.6px)",
              stagger: 0.02,
              ease: "power3.out",
            },
            0
          )
          .to(
            ".world-right .world-fragment",
            {
              x: () => window.innerWidth * -0.34,
              y: (i) => [-28, 16, 44, 0][i] || 0,
              opacity: 0.36,
              filter: "blur(0.6px)",
              stagger: 0.02,
              ease: "power3.out",
            },
            0
          )
          .to(
            ".world-title",
            {
              y: -34,
              opacity: 0.18,
              duration: 0.6,
              ease: "power3.out",
            },
            0.12
          )
          .to(
            ".convergence-symbol",
            {
              opacity: 1,
              scale: 1,
              filter: "drop-shadow(0 0 28px rgba(216,255,240,0.38))",
              duration: 0.8,
              ease: "power3.out",
            },
            0.32
          )
          .to(
            ".infinity-path",
            {
              strokeDashoffset: 0,
              duration: 0.88,
              ease: "power3.out",
            },
            0.36
          )
          .to(
            ".world-fragment",
            {
              opacity: 0.12,
              duration: 0.38,
              ease: "power3.out",
            },
            0.72
          );
      }
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      document.body.classList.remove("boot-lock");
      window.dispatchEvent(new Event("love:boot-unlocked"));
      ctx.revert();
    };
  }, [bootMessages, refs, setBootLines]);
}
