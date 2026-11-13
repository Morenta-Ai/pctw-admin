import { PackageX } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export default function OrderNotFound() {
  return (
    <div className="rounded-2xl border bg-card">
      <EmptyState
        icon={PackageX}
        title="No order with that ID"
        action={
          <Button asChild>
            <Link href="/orders">Back to orders</Link>
          </Button>
        }
      >
        Check the ID, which looks like ORD-5134.
      </EmptyState>
    </div>
  );
}
