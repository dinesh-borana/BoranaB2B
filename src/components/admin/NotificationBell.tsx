"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

const STORAGE_KEY = "admin-notifications-seen-at";
const POLL_INTERVAL = 30_000; // 30 seconds

export function NotificationBell() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [ringing, setRinging] = useState(false);
  const prevCount = useRef(0);

  function getLastSeen(): number {
    if (typeof window === "undefined") return Date.now();
    const v = localStorage.getItem(STORAGE_KEY);
    // Default: 24h ago so admin sees today's orders on first load
    return v ? Number(v) : Date.now() - 24 * 60 * 60 * 1000;
  }

  async function fetchCount() {
    try {
      const since = getLastSeen();
      const res = await fetch(`/api/admin/notifications?since=${since}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      const n = data.count ?? 0;

      // Trigger ring animation when new orders arrive
      if (n > prevCount.current && prevCount.current !== 0) {
        setRinging(true);
        setTimeout(() => setRinging(false), 700);
      }
      prevCount.current = n;
      setCount(n);
    } catch {
      // silently ignore network errors
    }
  }

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClick() {
    // Mark all current orders as "seen"
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setCount(0);
    prevCount.current = 0;
    router.push("/admin/orders?status=PENDING");
  }

  return (
    <button
      onClick={handleClick}
      aria-label={count > 0 ? `${count} new order${count > 1 ? "s" : ""}` : "Notifications"}
      className="relative grid h-9 w-9 place-items-center rounded-xl text-stone-500 hover:bg-stone-100 transition-colors"
    >
      <Bell
        className={`h-5 w-5 transition-transform ${ringing ? "animate-[bell-ring_0.6s_ease]" : ""}`}
      />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-bold text-white animate-scale-in">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
