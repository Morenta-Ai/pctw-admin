import { afterEach, describe, expect, it, vi } from "vitest";

import { getEnv, resetEnvForTests } from "@/core/config/env";

afterEach(() => {
  vi.unstubAllEnvs();
  resetEnvForTests();
});

describe("getEnv", () => {
  it("defaults to dev, mock data and the local API", () => {
    vi.stubEnv("APP_ENV", undefined);
    vi.stubEnv("API_BASE_URL", undefined);
    vi.stubEnv("USE_MOCK_DATA", undefined);

    expect(getEnv()).toMatchObject({
      APP_ENV: "dev",
      API_BASE_URL: "http://localhost:5080/api/v1",
      USE_MOCK_DATA: true,
    });
  });

  it("reads the real API settings", () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("API_BASE_URL", "https://staging.api.rethread.lk/api/v1");
    vi.stubEnv("USE_MOCK_DATA", "false");

    expect(getEnv()).toMatchObject({
      APP_ENV: "staging",
      USE_MOCK_DATA: false,
    });
  });

  it("fails loudly on a bad value", () => {
    vi.stubEnv("USE_MOCK_DATA", "yes");

    expect(() => getEnv()).toThrow(/USE_MOCK_DATA/);
  });
});
