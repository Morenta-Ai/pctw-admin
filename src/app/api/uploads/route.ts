import { NextResponse } from "next/server";

import { authorizeApi } from "@/core/auth/api-auth";
import { getCatalogueRepository } from "@/features/catalogue/data/catalogue-repository";

/**
 * Product photo uploads. A route handler rather than a Server Action,
 * because Server Action bodies are capped at 1 MB and photos can be 5.
 */
export async function POST(request: Request) {
  const auth = await authorizeApi("admin");
  if ("response" in auth) return auth.response;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { code: "NO_FILE", message: "Attach a photo." },
      { status: 400 },
    );
  }

  const result = await getCatalogueRepository().upload(file);
  if (!result.ok) {
    return NextResponse.json(result.error.toJSON(), {
      status: result.error.status || 502,
    });
  }
  return NextResponse.json(result.data, { status: 201 });
}
