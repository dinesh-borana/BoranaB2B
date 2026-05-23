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
  creditLimit: string;
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
    creditLimit: "",
    isActive: true,
    ...initial,
  });
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
        creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
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
            />
          </div>
          <Input
            label="City"
            value={form.city}
            onChange={(e) => patch("city", e.target.value)}
          />
          <Input
            label="State"
            value={form.state}
            onChange={(e) => patch("state", e.target.value)}
          />
          <Input
            label="Pincode"
            value={form.pincode}
            onChange={(e) => patch("pincode", e.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax & credit</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label="GSTIN"
            value={form.gstin}
            onChange={(e) => patch("gstin", e.target.value)}
            placeholder="24ABCDE1234F1Z5"
          />
          <Input
            label="PAN"
            value={form.pan}
            onChange={(e) => patch("pan", e.target.value)}
            placeholder="ABCDE1234F"
          />
          <Input
            label="Credit limit (₹, optional)"
            type="number"
            inputMode="decimal"
            min={0}
            value={form.creditLimit}
            onChange={(e) => patch("creditLimit", e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700 self-end pb-3">
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
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint="Credentials will be logged to console (SMS/WhatsApp stub)"
                required={createLogin}
                minLength={8}
              />
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
        <Button variant="admin" size="lg" block type="submit" disabled={loading}>
          {loading ? "Saving…" : initial?.id ? "Save changes" : "Create party"}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
