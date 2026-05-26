"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const timerRef = useRef<number | undefined>(undefined);

  // Hide loader when new route is ready
  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    window.clearTimeout(timerRef.current);
    setLoading(false);
  }, [pathname]);

  // Show loader immediately on any same-site link click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname) return;
        if (anchor.target === "_blank") return;
      } catch {
        return;
      }

      window.clearTimeout(timerRef.current);
      setLoading(true);
      // Failsafe — hide after 10s if navigation somehow stalls
      timerRef.current = window.setTimeout(() => setLoading(false), 10_000);
    };

    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        bottom: 82,
        left: "50%",
        transform: `translateX(-50%) translateY(${loading ? 0 : 20}px)`,
        opacity: loading ? 1 : 0,
        transition: loading
          ? "opacity 0.18s ease, transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)"
          : "opacity 0.22s ease, transform 0.22s ease",
        zIndex: 9999,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "white",
        padding: "10px 18px 10px 13px",
        borderRadius: 999,
        boxShadow: "0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)",
        border: "1px solid rgba(139,26,46,0.10)",
        willChange: "opacity, transform",
      }}
    >
      <div className="nav-spinner" />
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#4A3A28",
          letterSpacing: "0.1px",
          whiteSpace: "nowrap",
        }}
      >
        Loading…
      </span>
    </div>
  );
}
