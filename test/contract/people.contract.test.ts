import { describe, expect, it } from "vitest";

import {
  collectorDetailSchema,
  collectorPageSchema,
  hubListSchema,
  newCollectorInputSchema,
} from "@/features/collectors/data/models";
import {
  customerDetailSchema,
  customerPageSchema,
  statusChangeSchema,
} from "@/features/customers/data/models";
import {
  inviteStaffSchema,
  staffListSchema,
} from "@/features/staff/data/models";

import { requestSample, responseSample } from "./contract-samples";

describe("people contract", () => {
  it("parses the customer samples", () => {
    customerPageSchema.parse(
      responseSample(
        "GET /admin/customers?q=perera&status=active&page=1&pageSize=25",
      ),
    );
    customerDetailSchema.parse(responseSample("GET /admin/customers/{id}"));
    expect(
      statusChangeSchema.safeParse(
        requestSample("POST /admin/customers/{id}/status"),
      ).success,
    ).toBe(true);
  });

  it("parses the collector and hub samples", () => {
    collectorPageSchema.parse(
      responseSample(
        "GET /admin/collectors?q=ruwan&status=active&online=true&page=1&pageSize=25",
      ),
    );
    expect(
      collectorDetailSchema.parse(responseSample("GET /admin/collectors/{id}"))
        .loadKg,
    ).toBe(20.5);
    expect(
      newCollectorInputSchema.safeParse(requestSample("POST /admin/collectors"))
        .success,
    ).toBe(true);
    hubListSchema.parse(responseSample("GET /admin/hubs"));
  });

  it("parses the staff samples", () => {
    staffListSchema.parse(responseSample("GET /admin/staff"));
    expect(
      inviteStaffSchema.safeParse(requestSample("POST /admin/staff")).success,
    ).toBe(true);
  });
});
