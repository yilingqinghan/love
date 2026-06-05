import CatMark from "./CatMark.jsx";

export default function ContractLetterScene({
  agreementRef,
  letterSceneRef,
  catRef,
  audioRef,
  letterFinished,
  printedLetter,
  onAccept,
}) {
  return (
    <section className="contract-section" aria-label="契约与情书">
      <audio ref={audioRef} preload="auto">
        <source src="/assets/type.mp3" type="audio/mpeg" />
      </audio>

      <div className="contract-stage">
        <article ref={agreementRef} className="agreement">
          <header>
            <p className="doc-no">Private Agreement · Draft 01</p>
            <h2>《专属司机与情绪合伙人聘用协议》</h2>
          </header>

          <div className="parties">
            <div className="party">甲方：____________________</div>
            <div className="party">乙方：____________________</div>
          </div>

          <ol className="terms">
            <li>
              乙方自愿接受甲方在合理范围内发出的接送、陪伴、倾听与深夜碎碎念任务，并承诺以稳定情绪与清醒导航完成履行。
            </li>
            <li>
              甲方在备考法硕期间享有优先被鼓励权、优先被安抚权，以及在压力过高时无条件获得一个认真抱抱的请求权。
            </li>
            <li>
              双方确认，所有关于画布、法条、梦境、编译器与未来的谈话，均可构成彼此靠近的有效证据。
            </li>
            <li>本协议不设固定期限。自连接建立之日起，随每一次真诚表达自动续期。</li>
          </ol>

          <div className="signature-row">
            <div className="signature-line">甲方签署：</div>
            <div className="signature-line">乙方签署：</div>
          </div>

          <div className="accept-wrap">
            <button className="accept-button" type="button" onClick={onAccept}>
              [ 我同意 (Accept) ]
            </button>
          </div>
        </article>

        <div
          ref={letterSceneRef}
          className={`letter-scene ${letterFinished ? "finished" : ""}`}
          aria-live="polite"
        >
          <div className="letter-paper">
            <p className="letter-title">Private Letter · After Acceptance</p>
            <p className="typewriter-output">{printedLetter}</p>
            <div ref={catRef} className="cat-mark" aria-hidden="true">
              <CatMark />
            </div>
            {letterFinished && <p className="fine-print">连接保持中。</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
