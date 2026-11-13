import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/** The call centre's cue: pickups no collector has taken for 30+ minutes. */
export function OverdueBanner({ count }: { count: number }) {
  if (count === 0) return null;
  const plural = count === 1 ? "pickup has" : "pickups have";

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-warning-bg p-4 text-warning sm:flex-row sm:items-center">
      <Clock className="size-5 shrink-0" />
      <p className="text-sm font-semibold">
        {count} {plural} waited over 30 minutes for a collector.
        <span className="font-normal"> Assign them from the live map.</span>
      </p>
      <Button asChild size="sm" className="sm:ml-auto">
        <Link href="/dispatch">
          Open live map
          <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}
