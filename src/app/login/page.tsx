import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · Borana B2B" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(
      session.user.role === "ADMIN"
        ? "/admin/dashboard"
        : "/customer/dashboard",
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-50 via-white to-white">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <Logo size="lg" />
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
              Welcome back
            </h1>
            <p className="text-sm text-stone-500">
              Sign in to place your wholesale order with Borana Jewels.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <LoginForm />
          </div>
          <div className="mt-6 rounded-xl bg-brand-50/60 p-4 text-xs text-brand-900">
            <p className="font-semibold">Demo accounts (after seeding)</p>
            <ul className="mt-1 space-y-0.5 text-brand-800">
              <li>Admin — 9000000001 / admin@123</li>
              <li>Party — 9000000010 / party@123</li>
            </ul>
          </div>
        </div>
      </div>
      <footer className="border-t border-stone-200 bg-white py-4 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} Borana Jewels · All wholesale orders
      </footer>
    </div>
  );
}
