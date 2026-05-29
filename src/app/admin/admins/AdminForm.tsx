"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { createAdmin, updateAdmin } from "./actions";
import { ALL_PERMISSIONS } from "./permissions";

type InitialData = {
  id?: string;
  name: string;
  mobile: string;
  permissions: string[];
};

export function AdminForm({ initial }: { initial?: InitialData }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [mobile, setMobile] = useState(initial?.mobile ?? "");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<string[]>(initial?.permissions ?? []);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isAll = permissions.includes("all");

  function togglePerm(key: string) {
    if (key === "all") {
      setPermissions(isAll ? [] : ["all"]);
      return;
    }
    if (isAll) return;
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { name, mobile, password: password || undefined, permissions };
      const fd = new FormData();
      fd.set("payload", JSON.stringify(payload));
      if (initial?.id) {
        await updateAdmin(initial.id, fd);
      } else {
        await createAdmin(fd);
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
          <CardTitle>Admin details</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="off"
          />
          <Input
            label="Mobile (login ID)"
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            required
            autoComplete="off"
          />
          <div className="sm:col-span-2">
            <Input
              label={initial?.id ? "New password (leave blank to keep current)" : "Password"}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!initial?.id}
              minLength={6}
              autoComplete="new-password"
              hint="Min 6 caracters"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-admin-800" />
            <CardTitle>Permissions</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {ALL_PERMISSIONS.map(({ key, label }) => {
            const checked = key === "all" ? isAll : permissions.includes(key);
            const disabled = key !== "all" && isAll;
            return (
              <label
                key={key}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                  checked
                    ? "border-admin-800 bg-admin-800/5"
                    : "border-stone-200 hover:bg-stone-50"
                } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => togglePerm(key)}
                  className="h-4 w-4 rounded border-stone-300 accent-admin-800"
                />
                <span className="text-sm font-medium text-stone-800">{label}</span>
                {key === "all" && (
                  <span className="ml-auto text-xs font-semibold text-admin-800 bg-admin-800/10 px-2 py-0.5 rounded-full">
                    Super Admin
                  </span>
                )}
              </label>
            );
          })}
          <p className="text-xs text-stone-500 pt-1">
            Select specific permissions or grant all powers for a super admin.
          </p>
        </CardBody>
      </Card>

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}

      <div className="flex gap-2">
        <Button variant="admin" size="lg" block type="submit" disabled={loading}>
          {loading ? "Saving…" : initial?.id ? "Save changes" : "Create admin"}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
