import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · Borana B2B" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(
      session.user.role === "ADMIN" ? "/admin/dashboard" : "/customer/dashboard",
    );
  }
  return (
    <>
      {/* Preload logo before any JS runs — critical for LCP */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="preload"
        href="/borana-logo.png"
        as="image"
        type="image/png"
      />
      <LoginForm />
    </>
  );
}
