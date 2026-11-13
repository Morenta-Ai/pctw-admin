import { describe, expect, it } from "vitest";

import {
  productInputSchema,
  productPageSchema,
  uploadSchema,
} from "@/features/catalogue/data/models";

import { requestSample, responseSample } from "./contract-samples";

describe("catalogue contract", () => {
  it("parses the list, create and upload samples", () => {
    expect(
      productPageSchema.parse(
        responseSample(
          "GET /admin/products?category=women&status=published&uploadedOn=2026-11-07&q=denim&page=1&pageSize=25",
        ),
      ).items[0]?.id,
    ).toBe("prd_1");
    expect(
      productInputSchema.safeParse(requestSample("POST /admin/products"))
        .success,
    ).toBe(true);
    expect(uploadSchema.parse(responseSample("POST /admin/uploads")).id).toBe(
      "img_8",
    );
  });
});
