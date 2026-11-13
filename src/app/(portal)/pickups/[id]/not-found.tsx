import { PackageX } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export default function PickupNotFound() {
  return (
    <div className="rounded-2xl border bg-card">
      <EmptyState
        icon={PackageX}
        title="No pickup with that ID"
        action={
          <Button asChild>
            <Link href="/pickups">Back to pickups</Link>
          </Button>
        }
      >
        Check the ID, which looks like RT-24817.
      </EmptyState>
    </div>
  );
}
