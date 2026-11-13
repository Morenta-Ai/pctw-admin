import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppLogo } from "@/components/app/app-logo";
import { StatusPill, type PillTone } from "@/components/app/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, formatWeight } from "@/core/format/format";

export const metadata: Metadata = { title: "Design system" };

const swatches = [
  ["primary", "bg-primary", "#1F2A5A"],
  ["lime", "bg-lime", "#C6F24E"],
  ["lime-tint", "bg-lime-tint", "#EEF9C8"],
  ["secondary", "bg-secondary", "#E6E9F5"],
  ["background", "bg-background", "#F4F5F9"],
  ["foreground", "bg-foreground", "#0E1330"],
  ["muted-foreground", "bg-muted-foreground", "#545B7A"],
  ["cyan", "bg-cyan", "#2EB5C9"],
  ["teal", "bg-teal", "#1A8A9A"],
  ["destructive", "bg-destructive", "#B3261E"],
  ["danger-bg", "bg-danger-bg", "#FFE3E0"],
  ["warning-bg", "bg-warning-bg", "#FFF1D6"],
] as const;

const tones: PillTone[] = [
  "neutral",
  "lime",
  "cyan",
  "info",
  "success",
  "warning",
  "danger",
  "navy",
];

/** Dev-only reference for the brand tokens and shared components. */
export default function DesignSystemPage() {
  if (process.env.APP_ENV === "prod") notFound();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 p-8">
      <header className="flex items-center justify-between rounded-2xl bg-primary p-6">
        <AppLogo label="Design system" />
        <span className="text-sm text-sidebar-muted-foreground">
          Dev only · not shown in prod
        </span>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Colours</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {swatches.map(([name, className, hex]) => (
            <div key={name} className="rounded-xl border bg-card p-2">
              <div className={`${className} h-14 rounded-lg border`} />
              <p className="mt-2 text-sm font-semibold">{name}</p>
              <p className="font-mono text-xs text-muted-foreground">{hex}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">Type</h2>
        <h1 className="text-4xl font-bold">Bricolage Grotesque heading</h1>
        <h3 className="text-xl font-semibold">Section title</h3>
        <p>
          Plus Jakarta Sans body text. Collected{" "}
          <strong>{formatWeight(7.4)}</strong> for{" "}
          <strong>{formatMoney(88_800)}</strong>.
        </p>
        <p className="text-sm text-muted-foreground">Secondary text</p>
        <p className="font-mono text-sm">RT-24841 · COL-0457 · WB-2611-0012</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Controls</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tones.map((tone) => (
            <StatusPill key={tone} tone={tone} dot={tone === "lime"}>
              {tone}
            </StatusPill>
          ))}
          <Badge>Badge</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
        <div className="grid max-w-md gap-2">
          <Label htmlFor="ds-price">Price per kg (Rs.)</Label>
          <Input id="ds-price" placeholder="120.00" />
        </div>
        <div className="flex items-center gap-3">
          <Switch id="ds-switch" defaultChecked />
          <Label htmlFor="ds-switch">Auto-assign nearby collectors</Label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Card title</CardTitle>
            <CardDescription>Supporting description text.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold">
              {formatMoney(1_284_000, { decimals: false })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono">RT-24817</TableCell>
                  <TableCell>
                    <StatusPill tone="warning">Pending</StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatWeight(12)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono">RT-24822</TableCell>
                  <TableCell>
                    <StatusPill tone="success">Collected</StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatWeight(7.4)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
