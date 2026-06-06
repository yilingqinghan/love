import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

import { useConfession } from "../hooks/useConfession.js";
import { withBase } from "../utils/paths.js";

const BALLOON_LETTERS = ["I", "L", "O", "V", "E", "Y", "O", "U"];

const LETTER_PARAGRAPHS = [
  "小一，很高兴认识你呀。",
  "我一直觉得，人在这个世界上会遇见很多人。大多数人只是擦肩而过，像风吹过窗边，轻轻来，又轻轻走。可是有些人不一样，她出现的时候，像一颗星星忽然亮了一下，明明没有惊天动地，却让整片夜空都有了回声。",
  "你对我来说，好像就是这样的人。",
  "我们明明才认识不久，可我却总觉得，这场相遇不像是从零开始。好像在很久很久以前，我们就已经在各自的轨道上走了很远。你在你的世界里认真生活、努力向前，我也在我的世界里热烈奔跑、相信未来。然后某一天，两颗很像的星星，终于在茫茫宇宙里看见了彼此。",
  "这种感觉真的很奇妙。",
  "我说一些藏在话里的小心思，你总能听懂；我还没来得及把话说满，你好像就已经知道我想表达什么。你接住我的暗示，也接住我的热情。很多时候我都会想，怎么会有人和我这样相似呢？相似到让我觉得开心，相似到让我觉得心里那根弦被轻轻拨动，相似到我忍不住想继续靠近你。",
  "认识你以后，很多普通的小事都变得不普通了。",
  "你的消息不再只是消息，像是生活偷偷递给我的一颗糖。晚安不再只是晚安，像是一天结束前最温柔的仪式。电话里的沉默也不尴尬，反而像两颗心在很轻很轻地靠近。连想到你喜欢猫，想到你认真备考，想到你说话时那些可爱的语气，我都会觉得，原来喜欢一个人真的会让很多细节发光。",
  "我喜欢你的热情。不是那种浮在表面的热闹，而是你身上有一种很明亮的生命力，好像你认真相信生活，也认真相信爱。",
  "我也喜欢你的敏感。你能听懂我没有说出口的意思，能看见话语背后那些小小的试探和心动。和你说话的时候，我不用把自己藏起来，也不用装得很冷静。因为你会懂，也会回应。",
  "我喜欢你上进的样子。喜欢你明明也会累，却还是愿意为了想要的未来努力。喜欢你一边备考，一边依然保留着对世界的柔软和期待。你不是一个只有标签的人，不只是央美毕业，不只是正在备考法硕，不只是和我很像。你就是你，是一个让我越靠近越觉得珍贵的人。",
  "有时候我会觉得，我们真的像两团很相似的火。都热烈，都主动，都相信心动，也都不太擅长把喜欢藏得太深。可正因为这样，我才觉得这份相遇很难得。因为在这个需要人们学会克制、试探、保持距离的世界里，能遇到一个同样愿意真诚回应的人，真的像收到了一份很温柔的礼物。",
  "我不知道该不该把它叫作命运。",
  "如果说命运太重，那就叫幸运吧。",
  "如果说幸运还不够，那就叫宇宙偷偷给我的偏爱。",
  "认识你以后，我会开始期待你的消息，会想知道你今天有没有睡好、有没有开心、有没有因为备考觉得累。也会在某些安静的时刻突然想到你，然后心里变得很软。那种感觉不是轰轰烈烈的占有，而是一种很轻、很甜、很想靠近的牵挂。",
  "我想见你。",
  "想和你一起去撸猫，看你被猫咪吸引时的样子。",
  "想和你一起散步，听你讲那些属于你的想法和小情绪。",
  "想在某个不赶时间的下午，和你坐在一起，哪怕只是说一些没那么重要的话，也会觉得很开心。",
  "想把很多平凡的瞬间，因为有你在，慢慢变成值得记住的片段。",
  "我也想成为一个让你觉得安心的人。",
  "不是只在甜的时候出现，也不是只会说漂亮话。",
  "我想在你累的时候陪你，在你努力的时候支持你，在你开心的时候认真分享你的快乐，在你偶尔不那么坚强的时候，也能让你觉得：没关系，这里有一个人愿意温柔地接住你。",
  "我知道我们才刚刚认识不久，可有些心动就是来得很突然。它不像计划，也不像推理，更不像我平时擅长安排好的路线。它更像一阵风，忽然吹开了心里某扇很久没有打开的窗。然后我发现，原来生活真的可以因为一个人的出现，变得这么甜。",
  "所以我想很认真地告诉你：",
  "我喜欢你。",
  "喜欢和你聊天时那种停不下来的开心。喜欢你能听懂我的小心思。喜欢你把暧昧接得很自然又很可爱。喜欢你认真、热烈、柔软，又带着一点点让人想靠近的光。喜欢你出现以后，我好像变成了一个更容易期待明天的人。",
  "也许我们还需要更多时间，去认识彼此真实的样子。认识开心时的彼此，也认识疲惫时的彼此；认识热烈的彼此，也认识安静的彼此。可我并不害怕慢慢来。因为如果是你，我会觉得，慢一点也很好，认真一点也很好。",
  "我不想只是短暂地被心动点燃。我更想把这份喜欢好好放在手心里，珍惜它，照顾它，慢慢让它长成更温柔、更坚定的样子。",
  "如果可以的话，我想陪你走一段路。",
  "从晚安开始，从一句想你开始，从一次见面开始，从一个抱抱开始。",
  "慢慢地，把我们现在这份甜甜的心动，变成更多真实又美好的日常。",
  "小一，遇见你真的很开心。像在很远很远的宇宙里，我终于看见了一颗和我频率相同的星星。而我现在最想做的事，就是朝着你，多走近一点。",
];

const ConfessionScene = forwardRef(function ConfessionScene({ onAccept }, ref) {
  const [treeRun, setTreeRun] = useState(0);
  const [treeVisible, setTreeVisible] = useState(false);
  const [treeDone, setTreeDone] = useState(false);
  const [envelopeReady, setEnvelopeReady] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const treeFrameRef = useRef(null);
  const introStartedRef = useRef(false);
  const experienceCompleteRef = useRef(false);

  useEffect(() => {
    const fontId = "confession-balloon-font";
    if (document.getElementById(fontId)) return undefined;

    const link = document.createElement("link");
    link.id = fontId;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Wendy+One&display=swap";
    document.head.appendChild(link);

    return undefined;
  }, []);

  const activateScene = useCallback(() => {
    if (experienceCompleteRef.current) {
      setTreeVisible(false);
      setTreeDone(true);
      setEnvelopeReady(true);
      setLetterOpen(true);
      return;
    }

    if (introStartedRef.current) return;

    introStartedRef.current = true;
    setTreeRun((value) => value + 1);
    setTreeVisible(true);
    setTreeDone(false);
    setEnvelopeReady(false);
    setLetterOpen(false);
  }, []);

  useConfession({
    sectionRef: ref,
    onActivate: activateScene,
  });

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type !== "confession-tree-complete") return;
      if (treeFrameRef.current?.contentWindow && event.source !== treeFrameRef.current.contentWindow) return;
      experienceCompleteRef.current = true;
      setTreeDone(true);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!treeDone) {
      setEnvelopeReady(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setEnvelopeReady(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [treeDone]);

  useEffect(() => {
    if (!treeDone || !treeVisible) return undefined;

    const timer = window.setTimeout(() => {
      setTreeVisible(false);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [treeDone, treeVisible]);

  const handleOpenLetter = useCallback(() => {
    experienceCompleteRef.current = true;
    setLetterOpen(true);
  }, []);

  const handleAccept = useCallback(() => {
    onAccept?.();
  }, [onAccept]);

  return (
    <section ref={ref} className="confession-section" aria-label="表白页面">
      <div className="confession-stage">
        {treeVisible && (
          <iframe
            ref={treeFrameRef}
            key={`tree-${treeRun}`}
            title="I love you tree"
            className={`confession-tree-frame ${treeDone ? "is-done" : ""}`}
            src={withBase(`/confession-tree/index.html?v=confession-tree-1&run=${treeRun}`)}
            loading="eager"
          ></iframe>
        )}

        {treeDone && (
          <iframe
            title="sakura background"
            className="confession-sakura-frame"
            src={withBase("/confession-sakura/index.html?v=confession-sakura-3")}
            loading="eager"
          ></iframe>
        )}

        <div className={`confession-overlay ${envelopeReady ? "is-ready" : ""} ${letterOpen ? "letter-open" : ""}`}>
          <div className={`confession-balloons ${letterOpen ? "is-open" : ""}`} aria-hidden="true">
            {BALLOON_LETTERS.map((letter, index) => (
              <div key={`${letter}-${index}`} className={`confession-balloon confession-balloon-${index + 1}`}>
                <span>{letter}</span>
              </div>
            ))}
          </div>

          <div className={`confession-ribbons ${letterOpen ? "is-open" : ""}`} aria-hidden="true">
            <span className="confession-ribbon confession-ribbon-1"></span>
            <span className="confession-ribbon confession-ribbon-2"></span>
            <span className="confession-ribbon confession-ribbon-3"></span>
            <span className="confession-ribbon confession-ribbon-4"></span>
          </div>

          <button
            type="button"
            className={`confession-envelope ${envelopeReady ? "is-ready" : ""} ${letterOpen ? "is-open" : ""}`}
            onClick={handleOpenLetter}
            aria-expanded={letterOpen}
          >
            <span className="confession-envelope-back"></span>
            <span className="confession-envelope-letter"></span>
            <span className="confession-envelope-flap"></span>
            <span className="confession-envelope-seal">Open</span>
          </button>

          <div className={`confession-paper-shell ${letterOpen ? "is-open" : ""}`}>
            <article className="confession-paper">
              <div className="confession-paper-watermark" aria-hidden="true">
                ENFJ × Aries
              </div>

              <div className="confession-paper-ephemera" aria-hidden="true">
                <div className="confession-ticket">
                  <span className="confession-ticket-kicker">Private Route</span>
                  <strong>ENFJ-ARI / 0.000513%</strong>
                  <span className="confession-ticket-meta">star to home / for us</span>
                </div>
                <div className="confession-probability-chip">0.000513%</div>
                <div className="confession-pressed-sakura">
                  <span className="confession-petal confession-petal-1"></span>
                  <span className="confession-petal confession-petal-2"></span>
                  <span className="confession-petal confession-petal-3"></span>
                  <span className="confession-petal confession-petal-4"></span>
                  <span className="confession-petal confession-petal-5"></span>
                </div>
              </div>

              <div className="confession-heart-wrap" aria-hidden="true">
                <iframe
                  title="heart rate"
                  className="confession-heart-frame"
                  src={withBase("/confession-heart/index.html?v=confession-heart-1")}
                  loading="eager"
                ></iframe>
              </div>

              <div className="confession-paper-body">
                {LETTER_PARAGRAPHS.map((paragraph, index) => (
                  <p key={`${index}-${paragraph}`}>{paragraph}</p>
                ))}
                <p className="confession-postscript">P.S. 我真的很想认真地喜欢你，也想认真地走近你。</p>
                <p className="confession-dates">2001.03.28 → 2002.04.12</p>
                <p className="confession-signature">YQH</p>
              </div>

              <div className="confession-paper-actions">
                <button type="button" className="confession-keep-button" onClick={handleAccept}>
                  我愿意
                </button>
              </div>
            </article>
          </div>

          <div className={`confession-cat-trail ${letterOpen ? "is-open" : ""}`} aria-hidden="true">
            <span className="confession-cat-step confession-cat-step-1"></span>
            <span className="confession-cat-step confession-cat-step-2"></span>
            <span className="confession-cat-step confession-cat-step-3"></span>
            <span className="confession-cat-step confession-cat-step-4"></span>
            <span className="confession-cat-step confession-cat-step-5"></span>
          </div>
        </div>
      </div>
    </section>
  );
});

export default ConfessionScene;
