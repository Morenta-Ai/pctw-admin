import { NextResponse } from "next/server";

import { authorizeApi } from "@/core/auth/api-auth";
import { getEnv } from "@/core/config/env";
import { getMockWorld } from "@/mock/mock-world";

/**
 * Mock mode only: serves photos uploaded to the MockWorld. With the real
 * API, upload URLs point at its storage and this route is unused.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/uploads/[id]">,
) {
  const auth = await authorizeApi();
  if ("response" in auth) return auth.response;
  if (!getEnv().USE_MOCK_DATA) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "Not found." },
      { status: 404 },
    );
  }

  const upload = getMockWorld().uploads.get((await params).id);
  if (!upload) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "Not found." },
      { status: 404 },
    );
  }
  return new NextResponse(Buffer.from(upload.bytes), {
    headers: {
      "Content-Type": upload.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
