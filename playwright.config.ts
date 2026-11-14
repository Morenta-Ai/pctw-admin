import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const isCI = Boolean(process.env.CI);
/**
 * Set to the .NET API (`http://localhost:5080/api/v1`) to run the suite
 * against it instead of mock data. Re-seed the API first
 * (`dotnet run -- seed --reset`) and start it with
 * `Simulation__AutoAnswerOffers=true`, so offers get answered.
 */
const realApi = process.env.E2E_API_BASE_URL;

/**
 * End-to-end tests against a production build, on mock data unless
 * E2E_API_BASE_URL is set. Locally this builds first; CI builds in an
 * earlier step and only starts the server.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
    timezoneId: "Asia/Colombo",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: isCI
      ? `pnpm start -p ${PORT}`
      : `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    env: realApi
      ? { USE_MOCK_DATA: "false", API_BASE_URL: realApi, APP_ENV: "dev" }
      : { USE_MOCK_DATA: "true", APP_ENV: "dev" },
  },
});
