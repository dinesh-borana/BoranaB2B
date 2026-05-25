import { getAllSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsForm } from "./SettingsForm";
import { SignOutButton } from "./SignOutButton";

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

      {/* Sign out — only visible on mobile since desktop has it in sidebar */}
      <div className="md:hidden">
        <SignOutButton />
      </div>
    </div>
  );
}
