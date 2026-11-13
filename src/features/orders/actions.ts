"use server";

import { refresh } from "next/cache";

import { actionError, actionOk, type ActionResult } from "@/core/action-result";
import { requireRole } from "@/core/auth/session";
import type { OrderDetail } from "@/features/orders/data/models";
import { orderStatusInputSchema } from "@/features/orders/data/models";
import { getOrdersRepository } from "@/features/orders/data/orders-repository";

export async function setOrderStatus(
  orderId: string,
  status: string,
): Promise<ActionResult<OrderDetail>> {
  await requireRole("admin", "callCentre");
  const input = orderStatusInputSchema.parse({ status });

  const result = await getOrdersRepository().setStatus(orderId, input.status);
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(result.data);
}
