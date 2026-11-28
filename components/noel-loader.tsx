"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Đang treo đèn Noel…",
  "Rắc tuyết lên cửa hàng…",
  "Chuẩn bị vòng quay may mắn…",
  "Gói quà App Premium…",
  "Sắp xong rồi 🎄",
];

type Props = {
  /** Hiển thị full màn hình cố định (splash / loading route) */
  fullScreen?: boolean;
  /** Bắt buộc hiện tối thiểu ms (splash lần đầu) */
  minMs?: number;
  /** Tự ẩn sau khi xong (chỉ splash) */
  autoHide?: boolean;
  onHidden?: () => void;
};

export function NoelLoader({ fullScreen = true, minMs = 0, autoHide = false, onHidden }: Props) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(8);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MESSAGES.length);
    }, 900);
    return () => clearInterval(msgTimer);
  }, []);

  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        const boost = p < 40 ? 6 : p < 70 ? 3.5 : 1.5;
        return Math.min(92, p + boost + Math.random() * 2);
      });
    }, 120);

    if (!autoHide) {
      return () => clearInterval(tick);
    }

    const hide = setTimeout(() => {
      setProgress(100);
      setLeaving(true);
      setTimeout(() => {
        setGone(true);
        onHidden?.();
      }, 420);
    }, Math.max(minMs, 1100));

    return () => {
      clearInterval(tick);
      clearTimeout(hide);
      void start;
    };
  }, [autoHide, minMs, onHidden]);

  if (gone) return null;

  return (
    <div
      className={[
        "noel-loader",
        fullScreen ? "noel-loader--fullscreen" : "",
        leaving ? "noel-loader--leave" : "",
      ].join(" ")}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="noel-loader__glow noel-loader__glow--red" />
      <div className="noel-loader__glow noel-loader__glow--gold" />
      <div className="noel-loader__glow noel-loader__glow--green" />

      <div className="noel-loader__snow" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="noel-loader__flake"
            style={{
              left: `${(i * 5.7 + 3) % 100}%`,
              animationDelay: `${(i % 7) * 0.35}s`,
              animationDuration: `${2.8 + (i % 5) * 0.55}s`,
              fontSize: `${0.55 + (i % 4) * 0.18}rem`,
            }}
          >
            ❄
          </span>
        ))}
      </div>

      <div className="noel-loader__card">
        <div className="noel-loader__tree" aria-hidden>
          <div className="noel-loader__tree-layer noel-loader__tree-layer--1" />
          <div className="noel-loader__tree-layer noel-loader__tree-layer--2" />
          <div className="noel-loader__tree-layer noel-loader__tree-layer--3" />
          <div className="noel-loader__tree-trunk" />
          <div className="noel-loader__star">★</div>
          <span className="noel-loader__ornament noel-loader__ornament--1">●</span>
          <span className="noel-loader__ornament noel-loader__ornament--2">●</span>
          <span className="noel-loader__ornament noel-loader__ornament--3">●</span>
        </div>

        <div className="noel-loader__brand">
          <span className="noel-loader__badge">Noel 2026</span>
          <h1 className="noel-loader__title">Minh Wuan Store</h1>
          <p className="noel-loader__msg">{MESSAGES[msgIdx]}</p>
        </div>

        <div className="noel-loader__bar" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div className="noel-loader__bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="noel-loader__pct">{Math.round(progress)}%</div>
      </div>
    </div>
  );
}

/** Splash lần đầu vào site — tự ẩn */
export function NoelSplash() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("mw_noel_splash_seen")) {
        setShow(false);
        return;
      }
      sessionStorage.setItem("mw_noel_splash_seen", "1");
    } catch {
      /* ignore */
    }
  }, []);

  if (!show) return null;

  return (
    <NoelLoader
      fullScreen
      autoHide
      minMs={1400}
      onHidden={() => setShow(false)}
    />
  );
}
