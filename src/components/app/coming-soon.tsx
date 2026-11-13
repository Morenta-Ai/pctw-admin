import { Construction } from "lucide-react";

/** Placeholder for a section whose feature step hasn't been built yet. */
export function ComingSoon({
  step,
  children,
}: {
  /** The README status table's step number. */
  step: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card p-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
        <Construction className="size-6" />
      </span>
      <p className="font-heading text-lg font-semibold">
        Coming in step {step}
      </p>
      <p className="max-w-md text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
