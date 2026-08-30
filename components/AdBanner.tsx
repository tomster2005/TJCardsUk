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
    <div className="w-full overflow-hidden rounded-2xl" style={{ background: "#0d1212", border: "1px solid rgba(255,255,255,0.06)" }}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-4200997769629587"
        data-ad-slot="1550257487"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
