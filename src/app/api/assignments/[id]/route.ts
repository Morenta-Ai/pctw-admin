import { NextResponse } from "next/server";

import { getSession } from "@/core/auth/session";
import { getAssignmentsRepository } from "@/features/assignments/data/assignments-repository";

/** The assign dialog polls this every 2 s while an offer is open. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/assignments/[id]">,
) {
  if (!(await getSession())) {
    return NextResponse.json(
      { code: "UNAUTHENTICATED", message: "Sign in again." },
      { status: 401 },
    );
  }
  const { id } = await params;
  const result = await getAssignmentsRepository().get(id);
  if (!result.ok) {
    return NextResponse.json(result.error.toJSON(), {
      status: result.error.status || 502,
    });
  }
  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "no-store" },
  });
}
