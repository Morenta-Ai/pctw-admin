import { CalendarClock } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/core/auth/session";
import { formatDate, formatDateTime, formatMoney } from "@/core/format/format";
import { unwrap } from "@/core/result";
import { colomboDateKey } from "@/core/time";
import { CancelScheduledButton } from "@/features/rates/components/cancel-scheduled-button";
import { MultipliersForm } from "@/features/rates/components/multipliers-form";
import { RatesFormDialog } from "@/features/rates/components/rates-form-dialog";
import type { RateSet } from "@/features/rates/data/models";
import { getRatesRepository } from "@/features/rates/data/rates-repository";

export const metadata: Metadata = { title: "Rates & impact" };

export default async function RatesPage() {
  await requireRole("admin");
  const repo = getRatesRepository();
  const [ratesResult, multipliersResult] = await Promise.all([
    repo.getRates(),
    repo.getMultipliers(),
  ]);
  const rates = unwrap(ratesResult);
  const multipliers = unwrap(multipliersResult);
  const { current, scheduled } = rates;

  return (
    <>
      <PageHeader
        title="Rates & impact"
        description="What customers and collectors earn per kg, the marketplace transport charges, and the factors behind every customer's impact figures."
      />

      <Card>
        <CardHeader>
          <CardTitle>Rates</CardTitle>
          <CardDescription>
            In force since {formatDate(current.effectiveFrom)} · set by{" "}
            {current.createdBy}
          </CardDescription>
          <CardAction>
            <RatesFormDialog
              current={current}
              today={colomboDateKey(new Date())}
            />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {scheduled && (
            <div className="flex flex-col gap-3 rounded-lg bg-info-bg p-4 text-info sm:flex-row sm:items-center">
              <CalendarClock className="size-5 shrink-0" />
              <p className="text-sm">
                <strong>
                  Change scheduled for {formatDate(scheduled.effectiveFrom)}:
                </strong>{" "}
                customers {formatMoney(scheduled.customerRatePerKgCents)}/kg,
                collectors {formatMoney(scheduled.collectorRatePerKgCents)}/kg,
                delivery {formatMoney(scheduled.homeDeliveryChargeCents)}, click
                &amp; collect{" "}
                {formatMoney(scheduled.clickAndCollectChargeCents)}.
              </p>
              <div className="sm:ml-auto">
                <CancelScheduledButton />
              </div>
            </div>
          )}
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Rate
              label="Customer earns"
              value={current.customerRatePerKgCents}
              perKg
              highlight
            />
            <Rate
              label="Collector earns"
              value={current.collectorRatePerKgCents}
              perKg
            />
            <Rate
              label="Home delivery charge"
              value={current.homeDeliveryChargeCents}
            />
            <Rate
              label="Click & collect transport"
              value={current.clickAndCollectChargeCents}
            />
          </dl>
          {rates.history.length > 0 && <History history={rates.history} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Impact multipliers</CardTitle>
          <CardDescription>
            Each impact figure in the customer app is these factors × the kg a
            customer has recycled. Last changed{" "}
            {formatDateTime(multipliers.updatedAt)} by {multipliers.updatedBy}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MultipliersForm multipliers={multipliers.items} />
        </CardContent>
      </Card>
    </>
  );
}

function Rate({
  label,
  value,
  perKg = false,
  highlight = false,
}: {
  label: string;
  value: number;
  perKg?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "flex flex-col gap-1 rounded-xl bg-primary p-4 text-primary-foreground"
          : "flex flex-col gap-1 rounded-xl bg-muted p-4"
      }
    >
      <dt
        className={
          highlight
            ? "text-xs text-sidebar-muted-foreground"
            : "text-xs text-muted-foreground"
        }
      >
        {label}
      </dt>
      <dd className="font-heading text-2xl font-bold">
        {formatMoney(value)}
        {perKg && <span className="text-sm font-semibold"> / kg</span>}
      </dd>
    </div>
  );
}

function History({ history }: { history: RateSet[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Earlier rates</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead className="text-right">Customer / kg</TableHead>
            <TableHead className="text-right">Collector / kg</TableHead>
            <TableHead className="text-right">Delivery</TableHead>
            <TableHead className="text-right">Click &amp; collect</TableHead>
            <TableHead>Set by</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((rate) => (
            <TableRow key={rate.id}>
              <TableCell>{formatDate(rate.effectiveFrom)}</TableCell>
              <TableCell className="text-right">
                {formatMoney(rate.customerRatePerKgCents)}
              </TableCell>
              <TableCell className="text-right">
                {formatMoney(rate.collectorRatePerKgCents)}
              </TableCell>
              <TableCell className="text-right">
                {formatMoney(rate.homeDeliveryChargeCents)}
              </TableCell>
              <TableCell className="text-right">
                {formatMoney(rate.clickAndCollectChargeCents)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {rate.createdBy}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
