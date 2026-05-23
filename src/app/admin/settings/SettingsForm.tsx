"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { saveSettings } from "./actions";

type Settings = Record<string, string>;

const initial: Settings = {};

export function SettingsForm({ settings }: { settings: Settings }) {
  const [, action, pending] = useActionState(async (_prev: Settings, fd: FormData) => {
    await saveSettings(fd);
    return settings;
  }, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Shop</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            name="shop.name"
            label="Shop name"
            defaultValue={settings["shop.name"]}
            required
          />
          <Input
            name="shop.tagline"
            label="Tagline"
            defaultValue={settings["shop.tagline"]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders & tax</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            name="order.prefix"
            label="Order number prefix"
            defaultValue={settings["order.prefix"]}
            placeholder="BJ"
            required
          />
          <Input
            name="gst.rate"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            max={100}
            label="GST rate (%)"
            defaultValue={settings["gst.rate"]}
            required
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support contact</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            name="support.phone"
            label="Phone / WhatsApp"
            type="tel"
            defaultValue={settings["support.phone"]}
          />
          <Input
            name="support.email"
            label="Email"
            type="email"
            defaultValue={settings["support.email"]}
          />
        </CardBody>
      </Card>

      <Button type="submit" variant="admin" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
