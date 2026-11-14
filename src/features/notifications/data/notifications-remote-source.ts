import "server-only";

import type { ApiClient } from "@/core/api/api-client";
import {
  notificationPageSchema,
  type NotificationQuery,
} from "@/features/notifications/data/models";
import type { NotificationsSource } from "@/features/notifications/data/notifications-source";

export class NotificationsRemoteSource implements NotificationsSource {
  constructor(private readonly api: ApiClient) {}

  list(query: NotificationQuery) {
    return this.api.get("/admin/notifications", {
      query: {
        unread: query.unread || undefined,
        limit: query.limit,
        cursor: query.cursor,
      },
      schema: notificationPageSchema,
    });
  }

  async markRead(id: string) {
    await this.api.post(`/admin/notifications/${encodeURIComponent(id)}/read`);
  }

  async markAllRead() {
    await this.api.post("/admin/notifications/read-all");
  }
}
