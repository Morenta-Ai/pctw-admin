import type { Metadata } from "next";
import { Suspense } from "react";

import { AppLogo } from "@/components/app/app-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  const showMockAccounts =
    process.env.USE_MOCK_DATA !== "false" && process.env.APP_ENV !== "prod";

  return (
    <main className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 lg:flex">
        <AppLogo label="Admin & Call Centre" />
        <div className="relative z-10 flex max-w-md flex-col gap-4">
          <h1 className="text-4xl leading-tight font-bold text-white">
            Every kilo collected, <span className="text-lime">tracked</span>.
          </h1>
          <p className="text-sidebar-muted-foreground">
            Dispatch collectors, handle marketplace orders and keep rates and
            impact figures up to date for the whole ReThread network.
          </p>
        </div>
        <p className="text-xs text-sidebar-muted-foreground">
          Staff only. Activity is logged.
        </p>
        <div
          aria-hidden
          className="absolute -right-24 -bottom-24 size-96 rounded-full bg-lime/10"
        />
      </section>

      <section className="flex flex-col items-center justify-center gap-8 p-6 sm:p-12">
        <div className="w-full max-w-sm rounded-2xl bg-primary p-5 lg:hidden">
          <AppLogo label="Admin & Call Centre" />
        </div>

        <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Use the email and password from your ReThread admin.
            </p>
          </div>
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
        </div>

        {showMockAccounts && (
          <div className="w-full max-w-sm rounded-xl bg-lime-tint p-4 text-sm text-primary">
            <p className="font-semibold">Mock data accounts</p>
            <ul className="mt-1 font-mono text-xs leading-6">
              <li>admin@rethread.lk · rethread-admin</li>
              <li>callcentre@rethread.lk · rethread-callcentre</li>
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
      <Skeleton className="h-11" />
    </div>
  );
}
