import { describe, expect, it } from "vitest";

import { notificationPageSchema } from "@/features/notifications/data/models";

import { responseSample } from "./contract-samples";

describe("notifications contract", () => {
  it("parses the list sample", () => {
    const page = notificationPageSchema.parse(
      responseSample("GET /admin/notifications?unread=true&limit=20&cursor="),
    );
    expect(page.items[0]?.type).toBe("pickupWaiting");
  });
});
