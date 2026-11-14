import { NextResponse } from "next/server";

import { authorizeApi } from "@/core/auth/api-auth";
import { getNotificationsRepository } from "@/features/notifications/data/notifications-repository";

/** The top bar's bell polls this. */
export async function GET(request: Request) {
  const auth = await authorizeApi();
  if ("response" in auth) return auth.response;

  const params = new URL(request.url).searchParams;
  const result = await getNotificationsRepository().list({
    limit: Number(params.get("limit")) || 8,
    unread: params.get("unread") === "true",
  });
  if (!result.ok) {
    return NextResponse.json(result.error.toJSON(), {
      status: result.error.status || 502,
    });
  }
  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "no-store" },
  });
}
