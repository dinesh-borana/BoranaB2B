"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import {
  Smartphone, Lock, Eye, EyeOff,
  ArrowLeft, Send, ShieldCheck, Info,
} from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const LOGO_URL =
  "https://i.postimg.cc/VkFBZn7V/Panini-Jewels-Logo-HQ-Centered-Adjusted-(1).jpg";
const WA_NUMBER = "918860498653";
const WA_MSG = "Hi Panini Jewels, I want to request a B2B account.";
const RESEND_COOLDOWN = 30;

const C = {
  goldDeep: "#ba0000",
  gold:     "#B8801F",
  creamSoft:"#FBF6EC",
  ink:      "#1A1208",
  inkSoft:  "#4A3A28",
  muted:    "#8B7A65",
  line:     "#E8DCC4",
  error:    "#B42318",
  success:  "#027A48",
} as const;

type Toast = { msg: string; type: "error" | "success" } | null;

// Shared primary button style
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

  const [panel,    setPanel]    = useState<"login" | "otp">("login");
  const [otpStep,  setOtpStep]  = useState<1 | 2>(1);
  const [showPass, setShowPass] = useState(false);
  const [logoErr,  setLogoErr]  = useState(false);

  // Login field errors
  const [mobileErr, setMobileErr] = useState(false);
  const [passErr,   setPassErr]   = useState(false);

  // OTP state
  const [otpValues,      setOtpValues]      = useState(["", "", "", ""]);
  const [otpMobileErr,   setOtpMobileErr]   = useState(false);
  const [otpBoxErr,      setOtpBoxErr]      = useState(false);
  const [otpErrMsg,      setOtpErrMsg]      = useState("");
  const [currentOtpUser, setCurrentOtpUser] = useState("");
  const [sendPending,    setSendPending]    = useState(false);
  const [verifyPending,  setVerifyPending]  = useState(false);

  // Resend timer
  const [countdown,   setCountdown]   = useState(RESEND_COOLDOWN);
  const [canResend,   setCanResend]   = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Toast
  const [toast,      setToast]      = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs
  const otpBoxRefs    = useRef<(HTMLInputElement | null)[]>([]);
  const otpMobileRef  = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (timerRef.current)  clearInterval(timerRef.current);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  /* ── Utilities ── */
  function showToast(msg: string, type: "error" | "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  function validateMobile(v: string) {
    return /^[6-9]\d{9}$/.test(v.replace(/\D/g, ""));
  }

  function maskMobile(v: string) {
    const d = v.replace(/\D/g, "");
    return d.length <= 4 ? d : `${d.slice(0, 2)}XXXXXX${d.slice(-2)}`;
  }

  function startResendTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(RESEND_COOLDOWN);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function clearOtpBoxes() {
    setOtpValues(["", "", "", ""]);
    setOtpBoxErr(false);
    setOtpErrMsg("");
  }

  /* ── Password login ── */
  function handleLoginSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    const form   = e.currentTarget;
    const mobile = (form.elements.namedItem("identifier") as HTMLInputElement)?.value ?? "";
    const pass   = (form.elements.namedItem("password")   as HTMLInputElement)?.value ?? "";
    const mOk    = validateMobile(mobile);
    const pOk    = pass.length >= 1;
    setMobileErr(!mOk);
    setPassErr(!pOk);
    if (!mOk || !pOk) {
      e.preventDefault();
      showToast(!mOk ? "Please enter a valid 10-digit mobile number" : "Please enter your password", "error");
    }
  }

  /* ── Panel navigation ── */
  function goToOtp() {
    setPanel("otp"); setOtpStep(1);
    stopTimer(); clearOtpBoxes();
    setTimeout(() => otpMobileRef.current?.focus(), 80);
  }

  function goToLogin() {
    setPanel("login");
    stopTimer(); clearOtpBoxes();
    setCurrentOtpUser("");
  }

  /* ── OTP send ── */
  async function handleSendOtp(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const mobile = otpMobileRef.current?.value ?? "";
    if (!validateMobile(mobile)) {
      setOtpMobileErr(true);
      showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }
    setOtpMobileErr(false);
    setSendPending(true);
    try {
      await new Promise(r => setTimeout(r, 1100)); // stub — wire real API here
      setCurrentOtpUser(mobile);
      clearOtpBoxes();
      setOtpStep(2);
      startResendTimer();
      setTimeout(() => otpBoxRefs.current[0]?.focus(), 100);
      showToast("OTP sent successfully!", "success");
    } catch {
      showToast("Connection error. Please try again.", "error");
    } finally {
      setSendPending(false);
    }
  }

  /* ── OTP box handlers ── */
  function handleOtpChange(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 1) val = val.slice(-1);
    const next = [...otpValues];
    next[idx] = val;
    setOtpValues(next);
    setOtpBoxErr(false);
    setOtpErrMsg("");
    if (val && idx < 3) otpBoxRefs.current[idx + 1]?.focus();
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpValues[idx] && idx > 0) {
      e.preventDefault();
      const next = [...otpValues];
      next[idx - 1] = "";
      setOtpValues(next);
      otpBoxRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft"  && idx > 0) otpBoxRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 3) otpBoxRefs.current[idx + 1]?.focus();
    if (e.key === "Enter") handleVerifyOtp();
  }

  function handleOtpPaste(idx: number, e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    const next = [...otpValues];
    pasted.slice(0, 4 - idx).split("").forEach((ch, i) => { next[idx + i] = ch; });
    setOtpValues(next);
    const firstEmpty = next.findIndex(v => !v);
    otpBoxRefs.current[firstEmpty === -1 ? 3 : firstEmpty]?.focus();
    setOtpBoxErr(false);
    setOtpErrMsg("");
  }

  /* ── OTP verify ── */
  async function handleVerifyOtp() {
    const otp = otpValues.join("");
    if (otp.length < 4) {
      setOtpBoxErr(true);
      setOtpErrMsg("Please enter all 4 digits");
      const firstEmpty = otpValues.findIndex(v => !v);
      otpBoxRefs.current[firstEmpty]?.focus();
      return;
    }
    setVerifyPending(true);
    setOtpBoxErr(false);
    setOtpErrMsg("");
    try {
      await new Promise(r => setTimeout(r, 1200)); // stub
      showToast("OTP verified! Redirecting… (demo)", "success");
      stopTimer();
    } catch {
      setOtpBoxErr(true);
      setOtpErrMsg("Connection error. Please try again.");
    } finally {
      setVerifyPending(false);
    }
  }

  /* ── Resend ── */
  async function handleResend() {
    if (!canResend) return;
    setResendPending(true);
    try {
      await new Promise(r => setTimeout(r, 900)); // stub
      clearOtpBoxes();
      otpBoxRefs.current[0]?.focus();
      showToast("OTP resent!", "success");
      startResendTimer();
    } catch {
      showToast("Could not resend OTP.", "error");
    } finally {
      setResendPending(false);
    }
  }

  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MSG)}`;

  /* ── Render ── */
  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed", top: 24, left: "50%",
            transform: "translateX(-50%)",
            background: toast.type === "error" ? C.error : C.success,
            color: "white", padding: "12px 20px", borderRadius: 12,
            fontSize: 14, fontWeight: 500,
            boxShadow: "0 12px 30px -8px rgba(0,0,0,0.3)",
            zIndex: 1000, maxWidth: "90vw", textAlign: "center",
            pointerEvents: "none", whiteSpace: "nowrap",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Page background */}
      <div
        className="login-page-bg flex min-h-dvh items-start justify-center px-4 py-6 sm:items-center sm:py-10"
        style={{
          paddingTop:    "max(24px, env(safe-area-inset-top))",
          paddingBottom: "max(24px, env(safe-area-inset-bottom))",
        }}
      >
        <main
          className="login-card-anim relative z-10 w-full max-w-[420px] rounded-[20px] border bg-white p-7 sm:p-10"
          style={{
            borderColor: C.line,
            boxShadow: "0 24px 60px -20px rgba(133,79,11,0.25), 0 8px 20px -10px rgba(133,79,11,0.12)",
          }}
          role="main"
        >
          {/* ── Brand ── */}
          <div className="mb-7 flex flex-col items-center text-center">
            <div
              className="mb-3 flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-full border"
              style={{
                background: "linear-gradient(135deg, #FAEEDA 0%, #F4E0BC 100%)",
                borderColor: "rgba(133,79,11,0.12)",
                boxShadow: "0 8px 20px -6px rgba(133,79,11,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            >
              {logoErr ? (
                <span className="text-4xl">💎</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={LOGO_URL}
                  alt="Panini Jewels"
                  className="h-full w-full object-cover"
                  onError={() => setLogoErr(true)}
                />
              )}
            </div>
            <h1
              className="mb-1"
              style={{
                fontFamily: "var(--font-cormorant, Georgia, serif)",
                fontSize: 30, fontWeight: 600, color: C.ink,
                letterSpacing: "0.5px", lineHeight: 1.15,
              }}
            >
              Panini Jewels
            </h1>
            <p style={{ fontSize: 11.5, letterSpacing: 2, textTransform: "uppercase", color: C.muted, fontWeight: 500 }}>
              B2B Order shop
            </p>
          </div>

          {/* ════════════ Panel: Password login ════════════ */}
          {panel === "login" && (
            <form action={loginFormAction} onSubmit={handleLoginSubmit} noValidate autoComplete="on">
              {/* Mobile */}
              <div className="mb-4">
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
              <div className="mb-4">
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

              {/* Remember me + Forgot */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 20px", gap: 12, fontSize: 13 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, color: C.inkSoft, cursor: "pointer" }}>
                  <input type="checkbox" style={{ accentColor: C.goldDeep, width: 16, height: 16 }} />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={goToOtp}
                  style={{ color: C.goldDeep, fontWeight: 500, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Server-side error */}
              {loginState.error && (
                <div style={{ background: "#FEF3F2", border: `1px solid ${C.error}`, borderRadius: 10, padding: "10px 14px", fontSize: 13.5, color: C.error, marginBottom: 16 }}>
                  {loginState.error}
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
          )}

          {/* ════════════ Panel: OTP ════════════ */}
          {panel === "otp" && (
            <div>
              <button
                type="button"
                onClick={goToLogin}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: C.muted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "4px 8px 4px 0", marginBottom: 10 }}
              >
                <ArrowLeft size={15} /> Back to login
              </button>

              {/* Step 1: enter mobile */}
              {otpStep === 1 && (
                <form onSubmit={handleSendOtp} noValidate>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.goldDeep, opacity: 0.75, marginBottom: 4 }}>
                    Step 1 of 2
                  </p>
                  <p style={{ fontFamily: "var(--font-cormorant, Georgia, serif)", fontSize: 22, fontWeight: 600, color: C.ink, marginBottom: 14, lineHeight: 1.2 }}>
                    Login with OTP
                  </p>

                  <div className="mb-4">
                    <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.inkSoft, marginBottom: 8 }}>
                      Your registered mobile number
                    </label>
                    <div style={{ position: "relative" }}>
                      <Smartphone size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: otpMobileErr ? C.error : C.muted, pointerEvents: "none" }} />
                      <input
                        ref={otpMobileRef}
                        type="tel"
                        placeholder="10-digit mobile number"
                        autoComplete="username"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        className={`login-input${otpMobileErr ? " input-error" : ""}`}
                        onChange={e => {
                          const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                          if (e.target.value !== cleaned) e.target.value = cleaned;
                          setOtpMobileErr(false);
                        }}
                        onKeyDown={e => { if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault(); }}
                        required
                      />
                    </div>
                    {otpMobileErr && <p style={{ fontSize: 12, color: C.error, marginTop: 6 }}>Please enter a valid 10-digit mobile number</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={sendPending}
                    style={{ ...primaryBtn, opacity: sendPending ? 0.7 : 1, cursor: sendPending ? "not-allowed" : "pointer" }}
                  >
                    <Send size={16} /> {sendPending ? "Sending…" : "Send OTP"}
                  </button>
                </form>
              )}

              {/* Step 2: enter OTP */}
              {otpStep === 2 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.goldDeep, opacity: 0.75, marginBottom: 4 }}>
                    Step 2 of 2
                  </p>
                  <p style={{ fontFamily: "var(--font-cormorant, Georgia, serif)", fontSize: 22, fontWeight: 600, color: C.ink, marginBottom: 14, lineHeight: 1.2 }}>
                    Enter 4-digit OTP
                  </p>

                  {/* Info box */}
                  <div style={{ background: C.creamSoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px", marginBottom: 18, display: "flex", gap: 10 }}>
                    <Info size={18} style={{ color: C.goldDeep, flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>
                      <strong style={{ color: C.ink, display: "block", marginBottom: 2, fontSize: 13 }}>OTP sent successfully</strong>
                      A 4-digit OTP has been sent to{" "}
                      <span style={{ color: C.goldDeep, fontWeight: 600 }}>{maskMobile(currentOtpUser)}</span>.{" "}
                      <button
                        type="button"
                        onClick={() => { setOtpStep(1); stopTimer(); clearOtpBoxes(); setTimeout(() => otpMobileRef.current?.focus(), 80); }}
                        style={{ color: C.goldDeep, fontWeight: 500, fontSize: 12, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Change?
                      </button>
                    </div>
                  </div>

                  {/* OTP boxes */}
                  <label style={{ fontSize: 13, fontWeight: 500, color: C.inkSoft, marginBottom: 10, display: "block" }}>
                    Enter OTP
                  </label>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", margin: "4px 0 6px" }} role="group" aria-label="4-digit OTP">
                    {otpValues.map((val, idx) => (
                      <input
                        key={idx}
                        ref={el => { otpBoxRefs.current[idx] = el; }}
                        type="tel"
                        maxLength={1}
                        value={val}
                        className={`otp-box${val ? " otp-filled" : ""}${otpBoxErr ? " otp-error" : ""}`}
                        aria-label={`OTP digit ${idx + 1}`}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete={idx === 0 ? "one-time-code" : "off"}
                        onChange={e => handleOtpChange(idx, e)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        onFocus={e => { try { e.target.select(); } catch (_) {} }}
                        onPaste={e => handleOtpPaste(idx, e)}
                      />
                    ))}
                  </div>
                  {otpErrMsg && (
                    <p style={{ fontSize: 12, color: C.error, textAlign: "center", marginTop: 8 }}>{otpErrMsg}</p>
                  )}

                  {/* Resend row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, margin: "14px 0 20px", fontSize: 13, color: C.muted, flexWrap: "wrap" }}>
                    <span>Didn't receive it?</span>
                    <button
                      type="button"
                      disabled={!canResend || resendPending}
                      onClick={handleResend}
                      style={{ fontSize: 13, fontWeight: 600, color: canResend && !resendPending ? C.goldDeep : C.muted, background: "none", border: "none", cursor: canResend ? "pointer" : "default", fontFamily: "inherit", padding: 0 }}
                    >
                      {resendPending ? "Sending…" : "Resend OTP"}
                    </button>
                    {!canResend && (
                      <span>in <strong style={{ color: C.gold }}>{countdown}s</strong></span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={verifyPending}
                    onClick={handleVerifyOtp}
                    style={{ ...primaryBtn, opacity: verifyPending ? 0.7 : 1, cursor: verifyPending ? "not-allowed" : "pointer" }}
                  >
                    <ShieldCheck size={16} /> {verifyPending ? "Verifying…" : "Verify & Login"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Request account via WhatsApp */}
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13.5, color: C.inkSoft }}>
            Don't have an account?
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginTop: 12, background: "white", color: "#25D366",
                border: "1.5px solid #25D366", padding: "11px 16px", borderRadius: 12,
                fontFamily: "inherit", fontSize: 14, fontWeight: 600,
                cursor: "pointer", textDecoration: "none",
              }}
            >
              <WaIcon /> Request account on WhatsApp
            </a>
          </div>

          {/* Footer */}
          <p style={{ textAlign: "center", marginTop: 24, paddingTop: 20, borderTop: `1px dashed ${C.line}`, fontSize: 12, color: C.muted }}>
            Powered by{" "}
            <span style={{ fontWeight: 600, color: C.inkSoft }}>PaniniJewels</span>
          </p>
        </main>
      </div>
    </>
  );
}

function WaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
