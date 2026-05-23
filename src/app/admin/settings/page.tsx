import { getAllSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings · Admin" };

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <PageHeader
        title="Settings"
        description="Configure shop details, GST rate and more."
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
