import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { requireRole } from "@/core/auth/session";
import { unwrap } from "@/core/result";
import { DispatchBoard } from "@/features/dispatch/components/dispatch-board";
import { getDispatchRepository } from "@/features/dispatch/data/dispatch-repository";

export const metadata: Metadata = { title: "Live map" };

export default async function DispatchPage() {
  await requireRole();
  const dispatch = unwrap(await getDispatchRepository().getDispatch());

  return (
    <>
      <PageHeader
        title="Live map"
        description="Online collectors and open pickups. Pickups waiting more than 30 minutes turn red: pick one to see who's nearest."
      />
      <DispatchBoard
        initial={dispatch}
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || undefined}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined}
      />
    </>
  );
}
