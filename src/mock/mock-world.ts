import "server-only";

/**
 * The in-memory stand-in for the .NET API while it doesn't exist.
 *
 * Every `*-mock-source.ts` reads and writes this one object, so a change made
 * on one page (assigning a collector, say) shows up on every other page, the
 * same way the apps' MockWorld works. Seed data comes from the same samples
 * the user and collector apps use, so IDs like `RT-24841` and `COL-0457`
 * line up across all three.
 *
 * State lives for the life of the server process and resets on restart.
 */
export class MockWorld {
  /** When this world was seeded. Mock timestamps are relative to it. */
  readonly seededAt: Date;

  constructor(now: Date = new Date()) {
    this.seededAt = now;
  }

  private sequence = 0;

  /** A unique opaque id, such as `ord_3`. */
  nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}_${this.sequence}`;
  }
}

// Kept on globalThis so dev-server hot reloads don't wipe the world.
const store = globalThis as typeof globalThis & {
  __rethreadMockWorld?: MockWorld;
};

export function getMockWorld(): MockWorld {
  store.__rethreadMockWorld ??= new MockWorld();
  return store.__rethreadMockWorld;
}

/** Starts again from the seed data. For tests and the dev reset button. */
export function resetMockWorld(now?: Date): MockWorld {
  store.__rethreadMockWorld = new MockWorld(now);
  return store.__rethreadMockWorld;
}

/** A short pause, so loading states show in dev as they would against the API. */
export async function mockLatency(ms = 200): Promise<void> {
  if (process.env.VITEST || process.env.NODE_ENV === "test") return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}
