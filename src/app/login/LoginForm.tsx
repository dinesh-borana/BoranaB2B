"use client";

import { useActionState } from "react";
import { Lock, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        name="identifier"
        label="Mobile number or email"
        placeholder="98xxxxxxxx"
        autoComplete="username"
        leftAdornment={<User className="h-4 w-4" />}
        required
      />
      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="Enter your password"
        autoComplete="current-password"
        leftAdornment={<Lock className="h-4 w-4" />}
        required
      />
      {state.error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-xs text-stone-500">
        Trouble signing in? Call your Borana team contact.
      </p>
    </form>
  );
}
