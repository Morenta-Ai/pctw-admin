import { HeartHandshake } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/app/status-pill";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/core/auth/session";
import { formatCount, formatDateKey, formatMoney } from "@/core/format/format";
import { unwrap } from "@/core/result";
import { colomboDateKey } from "@/core/time";
import { ProjectDialog } from "@/features/donations/components/project-dialog";
import { getDonationsRepository } from "@/features/donations/data/donations-repository";

export const metadata: Metadata = { title: "Donations" };

export default async function DonationsPage() {
  await requireRole("admin");
  const projects = unwrap(await getDonationsRepository().list());
  const today = colomboDateKey(new Date());

  return (
    <>
      <PageHeader
        title="Donations"
        description="Social activity campaigns customers can donate their ReThread earnings to."
        actions={<ProjectDialog today={today} />}
      />
      {projects.length === 0 ? (
        <Card>
          <EmptyState icon={HeartHandshake} title="No projects yet">
            Add a project for customers to support.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const share = Math.min(
              100,
              (project.raisedCents / project.goalCents) * 100,
            );
            return (
              <Card
                key={project.id}
                className={project.active ? undefined : "opacity-75"}
              >
                <CardHeader>
                  <CardTitle className="leading-snug">{project.name}</CardTitle>
                  <CardDescription>{project.summary}</CardDescription>
                  <CardAction>
                    <ProjectDialog project={project} today={today} />
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-end justify-between gap-2">
                    <span className="font-heading text-2xl font-bold">
                      {formatMoney(project.raisedCents, { decimals: false })}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {formatMoney(project.goalCents, { decimals: false })}
                    </span>
                  </div>
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label={`${project.name} progress`}
                    aria-valuenow={Math.round(share)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-lime"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <StatusPill tone={project.active ? "success" : "neutral"}>
                      {project.active ? "Taking donations" : "Closed"}
                    </StatusPill>
                    <span className="text-muted-foreground">
                      {formatCount(project.donorCount)} donors
                      {project.endsOn
                        ? ` · ends ${formatDateKey(project.endsOn)}`
                        : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
