"use client";

import { useActionForm } from "@/hooks/use-action-form";

import { Loader2, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ActionResult } from "@/core/action-result";
import { errorMessage } from "@/core/api/api-error";
import { centsToRupeesInput } from "@/core/format/format";
import { saveDonationProject } from "@/features/donations/actions";
import type { DonationProject } from "@/features/donations/data/models";

/** Create a donation project, or edit one when `project` is given. */
export function ProjectDialog({
  project,
  today,
}: {
  project?: DonationProject;
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionForm<
    ActionResult<DonationProject> | null,
    FormData
  >(async (previous, formData) => {
    const result = await saveDonationProject(
      project?.id ?? null,
      previous,
      formData,
    );
    if (result.ok) {
      toast.success(project ? "Project saved." : `${result.data.name} added.`);
      setOpen(false);
    }
    return result;
  }, null);
  const failed = state && !state.ok ? state : undefined;
  const error = (name: string) => failed?.fieldErrors?.[name];
  const id = (name: string) => `${project?.id ?? "new"}-${name}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {project ? (
          <Button
            variant="outline"
            size="sm"
            aria-label={`Edit ${project.name}`}
          >
            <Pencil />
            Edit
          </Button>
        ) : (
          <Button>
            <Plus />
            New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={action} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {project ? `Edit ${project.name}` : "New donation project"}
            </DialogTitle>
            <DialogDescription>
              Active projects appear in the customer app&apos;s Donate screen.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id("name")}>Name</Label>
            <Input
              id={id("name")}
              name="name"
              defaultValue={project?.name}
              aria-invalid={Boolean(error("name"))}
            />
            {error("name") && (
              <p className="text-xs text-destructive">{error("name")}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={id("summary")}>Summary</Label>
            <Input
              id={id("summary")}
              name="summary"
              defaultValue={project?.summary}
              placeholder="Education · 420 children"
              maxLength={80}
              aria-invalid={Boolean(error("summary"))}
            />
            {error("summary") && (
              <p className="text-xs text-destructive">{error("summary")}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id("goal")}>Goal</Label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  Rs.
                </span>
                <Input
                  id={id("goal")}
                  name="goal"
                  inputMode="decimal"
                  defaultValue={
                    project ? centsToRupeesInput(project.goalCents) : ""
                  }
                  className="pl-10 tabular-nums"
                  aria-invalid={Boolean(error("goalCents"))}
                />
              </div>
              {error("goalCents") && (
                <p className="text-xs text-destructive">{error("goalCents")}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={id("endsOn")}>
                Ends on{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id={id("endsOn")}
                name="endsOn"
                type="date"
                min={today}
                defaultValue={project?.endsOn ?? ""}
                aria-invalid={Boolean(error("endsOn"))}
              />
              {error("endsOn") && (
                <p className="text-xs text-destructive">{error("endsOn")}</p>
              )}
            </div>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3">
            <span className="text-sm font-semibold">Taking donations</span>
            <Switch name="active" defaultChecked={project?.active ?? true} />
          </label>
          {failed && !failed.fieldErrors && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage(failed.error)}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {project ? "Save project" : "Add project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
