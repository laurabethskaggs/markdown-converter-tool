"use client";

import { useState } from "react";

type Level = "info" | "warn" | "error";

export type Diagnostic = {
  level: Level;
  message: string;
  time: string;
};

type Props = {
  items: Diagnostic[];
  stderr?: string;
  meta?: { ms?: number; bytesIn?: number; bytesOut?: number };
};

const levelClass: Record<Level, string> = {
  info: "info",
  warn: "warn",
  error: "error"
};

export default function Diagnostics({ items, stderr, meta }: Props) {
  const [open, setOpen] = useState(true);
  const list = items.slice(0, 10);
  const fmtBytes = (n?: number) => (n !== undefined ? `${(n / 1024).toFixed(1)} KB` : "—");
  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="hint">Diagnostics</div>
        <button className="btn secondary" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {meta && (
        <div className="status-line">
          <span className="status-dot" />
          <span>
            {meta.ms !== undefined ? `${meta.ms.toFixed(0)} ms` : "—"} • in {fmtBytes(meta.bytesIn)} • out {fmtBytes(meta.bytesOut)}
          </span>
        </div>
      )}
      {open && (
        <>
          {stderr && (
            <div className="diag error">
              <span className="tag">stderr</span>
              <span className="msg" style={{ whiteSpace: "pre-wrap" }}>{stderr}</span>
              <span className="time">pandoc</span>
            </div>
          )}
          <div className="diag-list">
            {list.map((d, i) => (
              <div key={i} className={`diag ${levelClass[d.level]}`}>
                <span className="tag">{d.level}</span>
                <span className="msg">{d.message}</span>
                <span className="time">{d.time}</span>
              </div>
            ))}
            {list.length === 0 && <div className="hint">No diagnostics yet.</div>}
          </div>
        </>
      )}
    </div>
  );
}
