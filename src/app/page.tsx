import { AppLogo } from "@/components/app/app-logo";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-primary p-8 text-center">
      <AppLogo label="Admin & Call Centre" />
      <p className="max-w-md text-sm text-sidebar-muted-foreground">
        The portal is being set up. Dispatch, orders, rates and accounts will
        appear here.
      </p>
    </main>
  );
}
