/*
 * Mock tokens carry the staff id (`mock.stf_1.access.<n>`) so a session
 * survives a dev-server restart, which resets the MockWorld.
 */
export const mockTokenFor = (
  staffId: string,
  kind: "access" | "refresh",
  n: string,
) => `mock.${staffId}.${kind}.${n}`;

export const staffIdFromMockToken = (token: string | undefined) =>
  token?.startsWith("mock.") ? token.split(".")[1] : undefined;
