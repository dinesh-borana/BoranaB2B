"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import boranaLogo from "../../../public/borana-logo.png";
import { Smartphone, Lock, Eye, EyeOff } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const WA_NUMBER = "918860498653";
const WA_MSG = "Hi Borana Creation, I want to request a B2B account.";

const C = {
  goldDeep: "#ba0000",
  ink:      "#1A1208",
  inkSoft:  "#4A3A28",
  muted:    "#8B7A65",
  line:     "#E8DCC4",
  error:    "#B42318",
} as const;

const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "none",
  borderRadius: 12,
  fontFamily: "inherit",
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: "0.3px",
  cursor: "pointer",
  background: `linear-gradient(135deg, ${C.goldDeep} 0%, #6B3F08 100%)`,
  color: "white",
  boxShadow: "0 4px 12px -2px rgba(133,79,11,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

export function LoginForm() {
  const [loginState, loginFormAction, loginPending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  const [showPass,   setShowPass]   = useState(false);
  const [mobileErr,  setMobileErr]  = useState(false);
  const [passErr,    setPassErr]    = useState(false);

  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MSG)}`;

  function handleLoginSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    const form   = e.currentTarget;
    const mobile = (form.elements.namedItem("identifier") as HTMLInputElement)?.value ?? "";
    const pass   = (form.elements.namedItem("password")   as HTMLInputElement)?.value ?? "";
    const mOk    = /^[6-9]\d{9}$/.test(mobile.replace(/\D/g, ""));
    const pOk    = pass.length >= 1;
    setMobileErr(!mOk);
    setPassErr(!pOk);
    if (!mOk || !pOk) e.preventDefault();
  }

  return (
    <div
      className="login-page-bg flex min-h-dvh items-start justify-center px-4 py-6 sm:items-center sm:py-10"
      style={{
        paddingTop:    "max(24px, env(safe-area-inset-top))",
        paddingBottom: "max(24px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />
      <main
        className="login-card-anim relative z-10 w-full max-w-[420px] rounded-[20px] border bg-white p-7 sm:p-10"
        style={{
          borderColor: C.line,
          boxShadow: "0 24px 60px -20px rgba(133,79,11,0.25), 0 8px 20px -10px rgba(133,79,11,0.12)",
        }}
        role="main"
      >
        {/* Brand */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="login-logo-anim" style={{ position: "relative", width: 160, height: 160, marginBottom: 12, flexShrink: 0 }}>
            <div className="login-logo-ring" />
            <div style={{ width: 160, height: 160, borderRadius: 24, overflow: "hidden", background: "#000", boxShadow: "0 12px 32px rgba(0,0,0,0.3)" }}>
              <Image src={boranaLogo} alt="Borana Creation" width={160} height={160} style={{ objectFit: "cover", width: "100%", height: "100%" }} priority />
            </div>
          </div>
          <p style={{ fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", color: C.muted, fontWeight: 500 }}>
            B2B Order portal
          </p>
        </div>

        {/* Login form */}
        <form action={loginFormAction} onSubmit={handleLoginSubmit} noValidate autoComplete="on">
          {/* Mobile */}
          <div className="mb-4 login-field-1">
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.inkSoft, marginBottom: 8 }}>
              Mobile number
            </label>
            <div style={{ position: "relative" }}>
              <Smartphone size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: mobileErr ? C.error : C.muted, pointerEvents: "none" }} />
              <input
                type="tel"
                name="identifier"
                placeholder="10-digit mobile number"
                autoComplete="username"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                autoCapitalize="none"
                spellCheck={false}
                className={`login-input${mobileErr ? " input-error" : ""}`}
                onChange={e => {
                  const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                  if (e.target.value !== cleaned) e.target.value = cleaned;
                  setMobileErr(false);
                }}
                onKeyDown={e => { if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault(); }}
                required
              />
            </div>
            {mobileErr && <p style={{ fontSize: 12, color: C.error, marginTop: 6 }}>Please enter a valid 10-digit mobile number</p>}
          </div>

          {/* Password */}
          <div className="mb-6 login-field-2">
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.inkSoft, marginBottom: 8 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: passErr ? C.error : C.muted, pointerEvents: "none" }} />
              <input
                type={showPass ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                className={`login-input input-padded-r${passErr ? " input-error" : ""}`}
                onChange={() => setPassErr(false)}
                required
              />
              <button
                type="button"
                aria-label={showPass ? "Hide password" : "Show password"}
                onClick={() => setShowPass(p => !p)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 6, borderRadius: 6, display: "flex" }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passErr && <p style={{ fontSize: 12, color: C.error, marginTop: 6 }}>Password is required</p>}
          </div>

          {/* Error */}
          {loginState.error && !loginState.inactive && (
            <div style={{ background: "#FEF3F2", border: `1px solid ${C.error}`, borderRadius: 10, padding: "10px 14px", fontSize: 13.5, color: C.error, marginBottom: 16 }}>
              {loginState.error}
            </div>
          )}

          {/* Inactive account */}
          {loginState.inactive && (
            <div style={{ background: "#FFF7ED", border: "1px solid #F97316", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: "#9A3412", marginBottom: 4 }}>Account deactivated</p>
              <p style={{ fontSize: 13, color: "#7C2D12", lineHeight: 1.5 }}>
                Your account has been deactivated. Please contact Borana Team to reactivate.
              </p>
              <a href={waHref} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, fontWeight: 600, color: "#25D366", textDecoration: "none" }}>
                <WaIcon /> Contact on WhatsApp
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loginPending}
            style={{ ...primaryBtn, opacity: loginPending ? 0.7 : 1, cursor: loginPending ? "not-allowed" : "pointer" }}
          >
            {loginPending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Request account */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13.5, color: C.inkSoft }}>
          Don&apos;t have an account?
          <a href={waHref} target="_blank" rel="noopener noreferrer"
            className="wa-btn-anim"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, background: "white", color: "#25D366", border: "1.5px solid #25D366", padding: "11px 16px", borderRadius: 12, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
            <WaIcon /> Request account on WhatsApp
          </a>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, paddingTop: 20, borderTop: `1px dashed ${C.line}`, fontSize: 12, color: C.muted }}>
          Powered by <span style={{ fontWeight: 600, color: C.inkSoft }}>Borana B2B</span>
        </p>
      </main>
    </div>
  );
}

function WaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
