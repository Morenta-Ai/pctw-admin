import { NextResponse } from "next/server";

import { getSession } from "@/core/auth/session";
import { getDispatchRepository } from "@/features/dispatch/data/dispatch-repository";

/** The live map polls this. Same data as the page's first render. */
export async function GET() {
  // Route handlers check the session themselves; proxy.ts isn't trusted alone.
  if (!(await getSession())) {
    return NextResponse.json(
      { code: "UNAUTHENTICATED", message: "Sign in again." },
      { status: 401 },
    );
  }

  const result = await getDispatchRepository().getDispatch();
  if (!result.ok) {
    return NextResponse.json(result.error.toJSON(), {
      status: result.error.status || 502,
    });
  }
  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "no-store" },
  });
}
