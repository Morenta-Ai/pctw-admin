import type { LucideIcon } from "lucide-react";

/** Shown when a list has nothing to show. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="size-6" />
      </span>
      <p className="font-heading text-lg font-semibold">{title}</p>
      {children && (
        <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
      )}
      {action}
    </div>
  );
}
