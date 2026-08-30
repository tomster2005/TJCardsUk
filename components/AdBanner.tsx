"use client";

import { useEffect, useRef } from "react";

export function AdBanner() {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div style={{ minHeight: "90px", background: "#0d1212", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, pointerEvents: "none" }}>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600, color: "rgba(255,255,255,0.2)" }}>Advertisement</span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.1)" }}>Pending Google approval</span>
      </div>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", minHeight: "90px", position: "relative", zIndex: 1 }}
        data-ad-client="ca-pub-4200997769629587"
        data-ad-slot="1550257487"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
