import { AppLogo } from "@/components/app/app-logo";

export default function Home() {
  return (
    <main className="bg-primary flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <AppLogo label="Admin & Call Centre" />
      <p className="text-sidebar-muted-foreground max-w-md text-sm">
        The portal is being set up. Dispatch, orders, rates and accounts will
        appear here.
      </p>
    </main>
  );
}
