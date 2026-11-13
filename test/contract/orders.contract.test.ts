import { describe, expect, it } from "vitest";

import {
  orderDetailSchema,
  orderPageSchema,
  orderStatusInputSchema,
} from "@/features/orders/data/models";

import { requestSample, responseSample } from "./contract-samples";

describe("orders contract", () => {
  it("parses the list, detail and status samples", () => {
    expect(
      orderPageSchema.parse(
        responseSample(
          "GET /admin/orders?status=placed&fulfilmentType=homeDelivery&q=nadeesha&page=1&pageSize=25",
        ),
      ).items[0]?.id,
    ).toBe("ORD-5134");
    expect(
      orderDetailSchema.parse(responseSample("GET /admin/orders/{id}")).vendor
        ?.id,
    ).toBe("vnd_nugegoda");
    expect(
      orderStatusInputSchema.safeParse(
        requestSample("POST /admin/orders/{id}/status"),
      ).success,
    ).toBe(true);
  });
});
