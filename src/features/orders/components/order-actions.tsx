"use client";

import { Ban, Check, Loader2, Printer, Store, Truck } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { errorMessage } from "@/core/api/api-error";
import { setOrderStatus } from "@/features/orders/actions";
import type { OrderDetail } from "@/features/orders/data/models";
import {
  nextStatuses,
  orderStatusLabels,
  type OrderStatus,
} from "@/features/orders/data/order-status";

function actionFor(status: OrderStatus, order: OrderDetail) {
  switch (status) {
    case "confirmed":
      return { label: "Confirm & create waybill", icon: Check };
    case "outForDelivery":
      return { label: "Mark out for delivery", icon: Truck };
    case "readyAtVendor":
      return { label: "Mark ready at vendor", icon: Store };
    case "completed":
      return {
        label:
          order.fulfilmentType === "homeDelivery"
            ? "Mark delivered"
            : "Mark collected",
        icon: Check,
      };
    default:
      return null;
  }
}

/** The order's next step, waybill printing and cancel. */
export function OrderActions({ order }: { order: OrderDetail }) {
  const [pending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const next = nextStatuses(order.status, order.fulfilmentType);
  const forward = next.find((s) => s !== "cancelled");
  const step = forward ? actionFor(forward, order) : null;

  const move = (status: OrderStatus) =>
    startTransition(async () => {
      const result = await setOrderStatus(order.id, status);
      if (result.ok) {
        toast.success(
          status === "confirmed"
            ? `${order.id} confirmed. Waybill ${result.data.waybillNumber} is ready to print.`
            : `${order.id}: ${orderStatusLabels[status].toLowerCase()}. The customer has been told.`,
        );
        setConfirmCancel(false);
      } else {
        toast.error(
          result.error.code === "ORDER_STATUS_CHANGED"
            ? "Someone else just updated this order. The page now shows its latest status."
            : errorMessage(result.error),
        );
      }
    });

  return (
    <div className="flex flex-wrap gap-2">
      {order.waybillNumber && (
        <Button variant="outline" asChild>
          <Link href={`/waybills/${order.id}`} target="_blank">
            <Printer />
            Print waybill
          </Link>
        </Button>
      )}
      {step && forward && (
        <Button disabled={pending} onClick={() => move(forward)}>
          {pending ? <Loader2 className="animate-spin" /> : <step.icon />}
          {step.label}
        </Button>
      )}
      {next.includes("cancelled") && (
        <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
          <Button variant="destructive" onClick={() => setConfirmCancel(true)}>
            <Ban />
            Cancel order
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel {order.id}?</DialogTitle>
              <DialogDescription>
                The customer is refunded to their ReThread wallet and told by
                notification. This can&apos;t be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Keep order</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() => move("cancelled")}
              >
                {pending && <Loader2 className="animate-spin" />}
                Cancel order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
