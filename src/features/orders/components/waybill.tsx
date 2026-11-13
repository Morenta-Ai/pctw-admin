import { AppLogoMark } from "@/components/app/app-logo";
import { formatDate, formatLkMobile } from "@/core/format/format";
import type { OrderDetail } from "@/features/orders/data/models";
import { fulfilmentLabels } from "@/features/orders/data/order-status";

/** Where every marketplace parcel leaves from. */
const SENDER = {
  name: "ReThread Central Hub",
  address: "Peliyagoda, Western Province",
  phone: "011 750 0500",
};

/** A one-page waybill for the courier or the click & collect point. */
export function Waybill({ order }: { order: OrderDetail }) {
  const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <article className="mx-auto flex w-full max-w-[190mm] flex-col gap-6 border-2 border-black p-8 text-black print:max-w-none print:border print:p-6">
      <header className="flex items-start justify-between gap-6 border-b-2 border-black pb-4">
        <div className="flex items-center gap-3">
          <AppLogoMark className="print:border print:border-black" />
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-xl font-bold">ReThread</span>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase">
              Rejuvenated garments
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase">
            Waybill
          </span>
          <span className="font-mono text-2xl font-bold">
            {order.waybillNumber}
          </span>
          <span className="text-xs">Order {order.id}</span>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-wider uppercase">
            From
          </span>
          <span className="font-semibold">{SENDER.name}</span>
          <span className="text-sm">{SENDER.address}</span>
          <span className="text-sm">{SENDER.phone}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-wider uppercase">
            {order.vendor ? "To (click & collect)" : "To"}
          </span>
          <span className="font-semibold">{order.customer.name}</span>
          {order.vendor && (
            <span className="text-sm">c/o {order.vendor.name}</span>
          )}
          <span className="text-sm">{order.destination}</span>
          {order.customer.mobile && (
            <span className="text-sm">
              {formatLkMobile(order.customer.mobile)}
            </span>
          )}
        </div>
      </section>

      <section className="grid grid-cols-4 gap-4 border-y border-black py-3 text-sm">
        <Field label="Date">
          {formatDate(
            order.timeline.find((e) => e.status === "confirmed")?.occurredAt ??
              order.createdAt,
          )}
        </Field>
        <Field label="Service">{fulfilmentLabels[order.fulfilmentType]}</Field>
        <Field label="Pieces">{pieces}</Field>
        <Field label="Payment">Prepaid · no cash to collect</Field>
      </section>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1 font-semibold">Item</th>
            <th className="py-1 font-semibold">Size</th>
            <th className="py-1 text-right font-semibold">Qty</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i} className="border-b border-black/20">
              <td className="py-1.5">{item.name}</td>
              <td className="py-1.5">{item.size}</td>
              <td className="py-1.5 text-right">{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="grid grid-cols-2 gap-10 pt-6 text-sm">
        <Signature label="Handed over by (ReThread)" />
        <Signature
          label={
            order.vendor ? "Received by (vendor)" : "Received by (customer)"
          }
        />
      </section>
    </article>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-semibold tracking-wider uppercase">
        {label}
      </span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

function Signature({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="h-10 border-b border-black" />
      <span>{label}</span>
      <span className="text-xs">Name, signature and date</span>
    </div>
  );
}
