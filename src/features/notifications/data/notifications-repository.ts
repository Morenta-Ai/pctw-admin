import "server-only";

import { getAccessToken, getApiClient } from "@/core/api/server-api";
import { getEnv } from "@/core/config/env";
import { guard, type Result } from "@/core/result";
import type {
  NotificationPage,
  NotificationQuery,
} from "@/features/notifications/data/models";
import { NotificationsMockSource } from "@/features/notifications/data/notifications-mock-source";
import { NotificationsRemoteSource } from "@/features/notifications/data/notifications-remote-source";
import type { NotificationsSource } from "@/features/notifications/data/notifications-source";
import { getMockWorld } from "@/mock/mock-world";

export type NotificationsRepository = {
  list(query: NotificationQuery): Promise<Result<NotificationPage>>;
  markRead(id: string): Promise<Result<void>>;
  markAllRead(): Promise<Result<void>>;
};

export function createNotificationsRepository(
  source: NotificationsSource,
): NotificationsRepository {
  return {
    list: (query) => guard(() => source.list(query)),
    markRead: (id) => guard(() => source.markRead(id)),
    markAllRead: () => guard(() => source.markAllRead()),
  };
}

export function getNotificationsRepository(): NotificationsRepository {
  const source = getEnv().USE_MOCK_DATA
    ? new NotificationsMockSource(getMockWorld(), getAccessToken)
    : new NotificationsRemoteSource(getApiClient());
  return createNotificationsRepository(source);
}
