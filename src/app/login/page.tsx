import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · Panini Jewels B2B" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(
      session.user.role === "ADMIN" ? "/admin/dashboard" : "/customer/dashboard",
    );
  }
  return <LoginForm />;
}
