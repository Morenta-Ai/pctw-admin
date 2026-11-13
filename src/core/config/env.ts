import "server-only";

import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const envSchema = z.object({
  APP_ENV: z.enum(["dev", "staging", "prod"]).default("dev"),
  /** Includes the `/api/v1` prefix, like the apps' `API_BASE_URL`. */
  API_BASE_URL: z.url().default("http://localhost:5080/api/v1"),
  /** Serve every repository from the in-memory MockWorld instead of the API. */
  USE_MOCK_DATA: booleanString.default(true),
  API_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  /** Encrypts the session cookie. Required outside dev; 32+ characters. */
  SESSION_SECRET: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(32).optional(),
  ),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/**
 * Server-side configuration, validated once. A bad value fails loudly at
 * startup instead of surfacing as a confusing request error later.
 */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration:\n${z.prettifyError(parsed.error)}`,
    );
  }
  if (!parsed.data.SESSION_SECRET && parsed.data.APP_ENV !== "dev") {
    throw new Error("SESSION_SECRET must be set outside dev.");
  }
  cached = parsed.data;
  return cached;
}

/** Clears the memoised env. For tests only. */
export function resetEnvForTests(): void {
  cached = undefined;
}

/**
 * Only for local development, so `pnpm dev` works without any setup. Staging
 * and prod refuse to start without a real SESSION_SECRET (see getEnv).
 */
export const DEV_SESSION_SECRET = "rethread-admin-dev-only-session-secret-0000";

export function getSessionSecret(): string {
  return getEnv().SESSION_SECRET ?? DEV_SESSION_SECRET;
}
