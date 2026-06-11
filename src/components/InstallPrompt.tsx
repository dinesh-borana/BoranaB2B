"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Already installed or dismissed recently — don't show
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      sessionStorage.getItem(DISMISSED_KEY)
    ) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-[76px] left-3 right-3 z-50 animate-fade-up">
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl shadow-brand-900/30"
        style={{
          background: "linear-gradient(135deg, #3d0f1e 0%, #6d1424 100%)",
          border: "1px solid rgba(196,154,60,0.3)",
        }}
      >
        {/* Logo mark */}
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ background: "rgba(196,154,60,0.15)", border: "1px solid rgba(196,154,60,0.3)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/borana-logo.png" alt="Borana" className="h-7 w-7 object-contain" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-white leading-tight">Install Borana B2B</p>
          <p className="text-[11px] text-white/60 leading-tight mt-0.5">Add to home screen for quick access</p>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstall}
          className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-[#3d0f1e] transition-opacity hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #c49a3c, #a8802c)" }}
        >
          <Download className="h-3.5 w-3.5" />
          Install
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white/40 hover:text-white/70 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
