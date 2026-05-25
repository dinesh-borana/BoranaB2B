"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [key, setKey] = useState(0);
  const [showBar, setShowBar] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      setShowBar(true);
      setKey((k) => k + 1);
      const t = setTimeout(() => setShowBar(false), 600);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  return (
    <>
      {showBar && <div className="page-load-bar" />}
      <div key={key} className="page-enter">
        {children}
      </div>
    </>
  );
}
