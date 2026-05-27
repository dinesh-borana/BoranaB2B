"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { createParty, updateParty } from "./actions";

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
  pan: string;
  isActive: boolean;
};

export function PartyForm({ initial }: { initial?: InitialData }) {
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
    pan: "",
    isActive: true,
    ...initial,
  });

  const isValid =
    form.shopName.trim() !== "" &&
    form.ownerName.trim() !== "" &&
    form.mobile.trim() !== "" &&
    form.address.trim() !== "" &&
    form.pincode.trim() !== "";

  const [createLogin, setCreateLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
          <Input
            label="City (optional)"
            value={form.city}
            onChange={(e) => patch("city", e.target.value)}
          />
          <Input
            label="State (optional)"
            value={form.state}
            onChange={(e) => patch("state", e.target.value)}
          />
          <Input
            label="Pincode"
            value={form.pincode}
            onChange={(e) => patch("pincode", e.target.value)}
            required
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
          <Input
            label="PAN (optional)"
            value={form.pan}
            onChange={(e) => patch("pan", e.target.value)}
            placeholder="ABCDE1234F"
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
                {/* Hidden input so browser password manager links mobile (not PAN) as username */}
                <input
                  type="text"
                  name="username"
                  value={form.mobile}
                  onChange={() => {}}
                  autoComplete="username"
                  style={{ display: "none" }}
                  aria-hidden="true"
                />
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
