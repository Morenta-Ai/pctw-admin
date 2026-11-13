import { z } from "zod";

import { pagedSchema } from "@/core/paged";
import {
  fulfilmentTypes,
  orderStatuses,
} from "@/features/orders/data/order-status";

const cents = z.number().int().nonnegative();

export const orderSummarySchema = z.object({
  id: z.string(),
  status: z.enum(orderStatuses),
  customerName: z.string(),
  itemCount: z.number().int().positive(),
  totalCents: cents,
  fulfilmentType: z.enum(fulfilmentTypes),
  vendorName: z.string().nullable(),
  waybillNumber: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;

export const orderPageSchema = pagedSchema(orderSummarySchema);

export const orderDetailSchema = z.object({
  id: z.string(),
  status: z.enum(orderStatuses),
  customer: z.object({ id: z.string(), name: z.string(), mobile: z.string() }),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      size: z.string(),
      quantity: z.number().int().positive(),
      unitPriceCents: cents,
    }),
  ),
  subtotalCents: cents,
  transportChargeCents: cents,
  totalCents: cents,
  fulfilmentType: z.enum(fulfilmentTypes),
  destination: z.string(),
  vendor: z
    .object({ id: z.string(), name: z.string(), address: z.string() })
    .nullable(),
  paymentMethod: z.enum(["card", "wallet"]),
  waybillNumber: z.string().nullable(),
  createdAt: z.iso.datetime(),
  timeline: z.array(
    z.object({
      status: z.enum(orderStatuses),
      occurredAt: z.iso.datetime(),
      actor: z.string().nullable(),
    }),
  ),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

export const orderQuerySchema = z.object({
  status: z.enum(orderStatuses).optional().catch(undefined),
  fulfilmentType: z.enum(fulfilmentTypes).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
});
export type OrderQuery = z.infer<typeof orderQuerySchema>;

export const orderStatusInputSchema = z.object({
  status: z.enum(orderStatuses),
});
