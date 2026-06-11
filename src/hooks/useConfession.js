import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useConfession({ sectionRef, onActivate }) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top 55%",
        end: "bottom bottom",
        onEnter: () => onActivate?.(),
        onEnterBack: () => onActivate?.(),
      });
    }, section);

    return () => ctx.revert();
  }, [onActivate, sectionRef]);
}
