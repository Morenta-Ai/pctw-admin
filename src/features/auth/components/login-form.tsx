"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "@/features/auth/actions";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "";
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-danger-bg p-3 text-sm font-medium text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          required
          defaultValue={state.email}
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={
            state.fieldErrors?.email ? "email-error" : undefined
          }
          className="h-11"
        />
        {state.fieldErrors?.email && (
          <p id="email-error" className="text-sm text-destructive">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={
            state.fieldErrors?.password ? "password-error" : undefined
          }
          className="h-11"
        />
        {state.fieldErrors?.password && (
          <p id="password-error" className="text-sm text-destructive">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
