import { forwardRef } from "react";

const BOOT_LEFT_STACK = [
  "EPFNOSUPPORT 96 Protocol family not supported",
  "EADDRNOTAVAIL 99 Cannot assign requested address",
  "EHOSTUNREACH 113 No route to host",
  "ENOLINK 67 Link has been severed",
  "ETIME 62 Timer expired",
  "ESTRPIPE 86 Streams pipe error",
  "ENOTUNIQ 76 Name not unique on network",
  "ECANCELED 125 Operation canceled",
  "EDEADLOCK 35 Resource deadlock avoided",
  "EIDRM 43 Identifier removed",
  "EBUSY 16 Device or resource busy",
];

const BOOT_CENTER_META = [
  "codec : libx264-152",
  "birth : 2001-03-28 :: 2002-04-12",
  "file : /sys/devices/virtual/net/resonance",
  "scope : improbable_pair_lock",
  "size : 4096 blocks",
  "mode : private / cinematic / hollywood",
  "status : beautiful coincidence pending",
];

const BOOT_MATRIX = [
  "K : : + % w z / e",
  "I 5 v - 4 m H N O",
  "j Y ! 2 5 v T L t",
  "L q l a w ; h H",
  "% o { r q : c R -",
  "7 2 D / Z @ I % 2",
  "U U ~ 9 p E C / S G",
  "} w o ] 9 t i p x u",
  "; @ j R K t - = u y $ o",
];

const BOOT_PROCESS_ROWS = [
  ["61", "root", "311M", "11168", "18.4"],
  ["694", "root", "314M", "18924", "6.2"],
  ["283", "root", "953M", "61164", "2.7"],
  ["311", "root", "292M", "6088", "1.9"],
  ["293", "root", "293M", "5252", "0.8"],
  ["521", "root", "287M", "5084", "0.7"],
];

const BOOT_SPEED = [
  "1GiB/s ------------",
  "1MiB/s ------------",
  "1KiB/s ------------",
  "TX: eth0   0 B/s",
  "RX: eth0   0 B/s",
];

const BOOT_HEX = [
  "00000370 55 5f 50 52 45 46 49 58 0a 2e 20 22",
  "00000380 24 7b 42 59 5f 50 52 45 46 49 58 7d 2f",
  "00000390 24 7b 50 4b 47 7d 2f 69 6e 63 6c 75 64",
  "000003a0 6f 6d 6f 66 64 6d 6f 22 0a 0a 65 78 63",
  "000003b0 20 22 24 7b 59 4f 42 55 5f 50 59 54 48",
  "000003c0 42 59 4f 42 55 5f 50 52 45 46 49 58 7d",
  "000003d0 62 2f 24 7b 50 4b 47 7d 2f 6c 69 62 2f",
];

const BootSequence = forwardRef(function BootSequence({ lines }, ref) {
  const visibleLines = lines.slice(-16);
  const progress = Math.min(100, Math.round((lines.length / 25) * 100));

  return (
    <div ref={ref} className="boot-overlay" aria-label="启动序列">
      <div className="boot-grid" aria-hidden="true"></div>
      <div className="boot-vignette" aria-hidden="true"></div>
      <div className="boot-scanlines" aria-hidden="true"></div>
      <div className="boot-panel left" aria-hidden="true"></div>
      <div className="boot-panel right" aria-hidden="true"></div>
      <div className="boot-chrome boot-chrome-top" aria-hidden="true">
        <span>cinematic intrusion / private build / feed active</span>
        <span>progress :: {progress}%</span>
      </div>
      <div className="boot-chrome boot-chrome-bottom" aria-hidden="true">
        <span>origin :: improbable coordinate system</span>
        <span>destination :: beautiful coincidence</span>
      </div>
      <div className="boot-console-shell">
        <aside className="boot-pane boot-pane-errors" aria-hidden="true">
          {BOOT_LEFT_STACK.map((item) => (
            <span className="boot-pale-line" key={item}>
              {item}
            </span>
          ))}
        </aside>

        <section className="boot-pane boot-pane-main">
          <div className="boot-pane-main-top">
            <div className="boot-pane-main-blank"></div>
            <div className="boot-pane-main-meta">
              {BOOT_CENTER_META.map((item) => (
                <span className="boot-meta-line" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="boot-pane-main-middle">
            <div className="boot-console">
              <p className="boot-console-title">hollywood private terminal / live boot feed</p>
              <div className="boot-log">
                {visibleLines.map((line, index) => (
                  <span className="boot-line" key={`${index}-${line}`}>
                    {line}
                  </span>
                ))}
                <span className="boot-cursor" aria-hidden="true"></span>
              </div>
            </div>
          </div>
          <div className="boot-pane-main-bottom" aria-hidden="true">
            {BOOT_MATRIX.map((item) => (
              <span className="boot-matrix-line" key={item}>
                {item}
              </span>
            ))}
          </div>
        </section>

        <aside className="boot-pane boot-pane-system" aria-hidden="true">
          <div className="boot-pane-system-top">
            <p className="boot-side-title">tasks / load / uptime</p>
            <div className="boot-process-head">
              <span>PID</span>
              <span>USER</span>
              <span>VIRT</span>
              <span>RES</span>
              <span>CPU</span>
            </div>
            {BOOT_PROCESS_ROWS.map((row) => (
              <div className="boot-process-row" key={row.join("-")}>
                {row.map((cell) => (
                  <span key={cell}>{cell}</span>
                ))}
              </div>
            ))}
          </div>
          <div className="boot-pane-system-mid">
            <p className="boot-side-title">speedometer 2.8</p>
            {BOOT_SPEED.map((item) => (
              <span className="boot-pale-line" key={item}>
                {item}
              </span>
            ))}
          </div>
          <div className="boot-pane-system-bottom">
            {BOOT_HEX.map((item) => (
              <span className="boot-hex-line" key={item}>
                {item}
              </span>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
});

export default BootSequence;
