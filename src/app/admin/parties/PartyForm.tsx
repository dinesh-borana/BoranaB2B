"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { createParty, updateParty, changePartyPassword, createPartyLogin } from "./actions";

type InitialData = {
  id?: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  altMobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  isActive: boolean;
};

export function PartyForm({ initial, hasLogin, currentPassword }: { initial?: InitialData; hasLogin?: boolean; currentPassword?: string | null }) {
  const router = useRouter();
  const [form, setForm] = useState<InitialData>({
    shopName: "",
    ownerName: "",
    mobile: "",
    altMobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    isActive: true,
    ...initial,
  });

  const isValid =
    form.shopName.trim() !== "" &&
    form.ownerName.trim() !== "" &&
    form.mobile.trim() !== "" &&
    form.address.trim() !== "" &&
    form.pincode.trim() !== "";

  // ── Pincode auto-fill ────────────────────────────────────────────────────────
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "loading" | "found" | "error">("idle");
  const [pincodeError, setPincodeError] = useState("");
  const pincodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const pin = form.pincode.trim();
    if (pincodeTimer.current) clearTimeout(pincodeTimer.current);

    if (!/^\d{6}$/.test(pin)) {
      setPincodeStatus("idle");
      setPincodeError("");
      return;
    }

    setPincodeStatus("loading");
    setPincodeError("");

    pincodeTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pincode/${pin}`);
        const data = await res.json();
        if (res.ok && data.city && data.state) {
          setForm((f) => ({ ...f, city: data.city, state: data.state }));
          setPincodeStatus("found");
        } else {
          setPincodeStatus("error");
          setPincodeError("Pincode not found. Please enter city and state manually.");
        }
      } catch {
        setPincodeStatus("error");
        setPincodeError("Could not fetch pincode details. Please enter city and state manually.");
      }
    }, 400);

    return () => { if (pincodeTimer.current) clearTimeout(pincodeTimer.current); };
  }, [form.pincode]);

  // ── Main form state ──────────────────────────────────────────────────────────
  const [createLogin, setCreateLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Change password (edit mode, party already has login)
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  // Create login (edit mode, party has no login yet)
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginCreated, setLoginCreated] = useState(false);

  async function handlePasswordChange() {
    if (!initial?.id) return;
    setPwError(""); setPwSuccess(""); setPwLoading(true);
    try {
      await changePartyPassword(initial.id, newPassword);
      setPwSuccess("Password updated successfully");
      setNewPassword(""); setShowChangePw(false); setShowNewPw(false);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setPwLoading(false); }
  }

  async function handleCreateLogin() {
    if (!initial?.id) return;
    setLoginError(""); setLoginLoading(true);
    try {
      await createPartyLogin(initial.id, password);
      setLoginCreated(true); setPassword(""); setCreateLogin(false);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setLoginLoading(false); }
  }

  function patch(key: keyof InitialData, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        createLogin: !initial?.id && createLogin,
        loginPassword: !initial?.id && createLogin ? password : undefined,
      };
      const fd = new FormData();
      fd.set("payload", JSON.stringify(payload));
      if (initial?.id) {
        await updateParty(initial.id, fd);
      } else {
        await createParty(fd);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Business details</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Shop name"
              value={form.shopName}
              onChange={(e) => patch("shopName", e.target.value)}
              required
            />
          </div>
          <Input
            label="Owner name"
            value={form.ownerName}
            onChange={(e) => patch("ownerName", e.target.value)}
            required
          />
          <Input
            label="Mobile"
            type="tel"
            value={form.mobile}
            onChange={(e) => patch("mobile", e.target.value)}
            required
          />
          <Input
            label="Alt. mobile (optional)"
            type="tel"
            value={form.altMobile}
            onChange={(e) => patch("altMobile", e.target.value)}
          />
          <Input
            label="Email (optional)"
            type="email"
            value={form.email}
            onChange={(e) => patch("email", e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Textarea
              label="Address"
              value={form.address}
              onChange={(e) => patch("address", e.target.value)}
              placeholder="Street, area…"
              required
            />
          </div>

          {/* Pincode first — triggers auto-fill */}
          <div>
            <Input
              label="Pincode"
              value={form.pincode}
              onChange={(e) => patch("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              maxLength={6}
              placeholder="6-digit pincode"
              rightAdornment={
                pincodeStatus === "loading"
                  ? <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                  : pincodeStatus === "found"
                  ? <span className="text-xs font-medium text-emerald-600">Found</span>
                  : null
              }
            />
            {pincodeStatus === "error" && (
              <p className="mt-1 text-xs text-rose-500">{pincodeError}</p>
            )}
          </div>

          <Input
            label="City"
            value={form.city}
            onChange={(e) => patch("city", e.target.value)}
            placeholder="Auto-filled from pincode"
          />
          <Input
            label="State"
            value={form.state}
            onChange={(e) => patch("state", e.target.value)}
            placeholder="Auto-filled from pincode"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax details</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label="GSTIN (optional)"
            value={form.gstin}
            onChange={(e) => patch("gstin", e.target.value)}
            placeholder="24ABCDE1234F1Z5"
            autoComplete="off"
          />
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => patch("isActive", e.target.checked)}
              className="rounded border-stone-300"
            />
            Active party
          </label>
        </CardBody>
      </Card>

      {/* New party: option to create login */}
      {!initial?.id && (
        <Card>
          <CardHeader>
            <CardTitle>App login</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={createLogin}
                onChange={(e) => setCreateLogin(e.target.checked)}
                className="rounded border-stone-300"
              />
              Create a login account for this party
            </label>
            {createLogin && (
              <div className="flex flex-col gap-4">
                <div className="rounded-lg bg-stone-50 border border-stone-200 px-3 py-2.5 text-sm">
                  <span className="text-stone-500">Username (login ID): </span>
                  <span className="font-semibold text-stone-900">
                    {form.mobile || <span className="text-stone-400 italic">enter mobile number above</span>}
                  </span>
                </div>
                <input type="text" name="username" value={form.mobile} onChange={() => {}} autoComplete="username" style={{ display: "none" }} aria-hidden="true" />
                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  hint="Party will log in using their mobile number as username"
                  required={createLogin}
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Edit mode: party has existing login → change password */}
      {initial?.id && hasLogin && (
        <Card>
          <CardHeader>
            <CardTitle>App login</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <div className="rounded-lg bg-stone-50 border border-stone-200 px-3 py-2.5 text-sm">
              <span className="text-stone-500">Username (login ID): </span>
              <span className="font-semibold text-stone-900">{form.mobile}</span>
            </div>
            <div className="rounded-lg bg-stone-50 border border-stone-200 px-3 py-2.5 text-sm flex items-center justify-between gap-2">
              <div>
                <span className="text-stone-500">Current password: </span>
                <span className="font-semibold text-stone-900 font-mono">
                  {currentPassword
                    ? showCurrentPw ? currentPassword : "••••••••"
                    : <span className="italic text-stone-400">not recorded</span>}
                </span>
              </div>
              {currentPassword && (
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((v) => !v)}
                  className="text-stone-400 hover:text-stone-600 shrink-0"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
            {pwSuccess && (
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {pwSuccess}
              </div>
            )}
            {!showChangePw ? (
              <button
                type="button"
                onClick={() => { setShowChangePw(true); setPwSuccess(""); }}
                className="self-start rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Change password
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <Input
                  label="New password"
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  hint="Minimum 8 characters"
                  rightAdornment={
                    <button
                      type="button"
                      onClick={() => setShowNewPw((v) => !v)}
                      className="text-stone-400 hover:text-stone-600"
                      tabIndex={-1}
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                {pwError && (
                  <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{pwError}</div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="admin" size="sm" onClick={handlePasswordChange} disabled={pwLoading || newPassword.length < 8}>
                    {pwLoading ? "Saving…" : "Update password"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setShowChangePw(false); setNewPassword(""); setPwError(""); setShowNewPw(false); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Edit mode: party has no login yet → option to create one */}
      {initial?.id && !hasLogin && !loginCreated && (
        <Card>
          <CardHeader>
            <CardTitle>App login</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <p className="text-sm text-stone-500">This party does not have an app login yet.</p>
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={createLogin}
                onChange={(e) => setCreateLogin(e.target.checked)}
                className="rounded border-stone-300"
              />
              Create a login account for this party
            </label>
            {createLogin && (
              <div className="flex flex-col gap-4">
                <div className="rounded-lg bg-stone-50 border border-stone-200 px-3 py-2.5 text-sm">
                  <span className="text-stone-500">Username (login ID): </span>
                  <span className="font-semibold text-stone-900">{form.mobile}</span>
                </div>
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  hint="Party will log in using their mobile number as username"
                  minLength={8}
                  autoComplete="new-password"
                />
                {loginError && (
                  <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{loginError}</div>
                )}
                <Button type="button" variant="admin" size="sm" onClick={handleCreateLogin} disabled={loginLoading || password.length < 8}>
                  {loginLoading ? "Creating…" : "Create login"}
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {initial?.id && !hasLogin && loginCreated && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          Login account created successfully. Party can now log in with their mobile number.
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="admin" size="lg" block type="submit" disabled={loading || !isValid}>
          {loading ? "Saving…" : initial?.id ? "Save changes" : "Create party"}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
