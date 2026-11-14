"use server";

import { refresh } from "next/cache";

import { actionError, actionOk, type ActionResult } from "@/core/action-result";
import { requireRole } from "@/core/auth/session";
import { getNotificationsRepository } from "@/features/notifications/data/notifications-repository";

export async function markNotificationRead(id: string): Promise<ActionResult> {
  await requireRole();
  const result = await getNotificationsRepository().markRead(id);
  return result.ok ? actionOk(undefined) : actionError(result.error);
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  await requireRole();
  const result = await getNotificationsRepository().markAllRead();
  if (!result.ok) return actionError(result.error);
  refresh();
  return actionOk(undefined);
}
