"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { errorMessage } from "@/core/api/api-error";
import { setPublished } from "@/features/catalogue/actions";

/** Shows or hides a product in the shop straight from the table. */
export function PublishSwitch({
  productId,
  name,
  published,
}: {
  productId: string;
  name: string;
  published: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(published);
  const [, startTransition] = useTransition();

  return (
    <Switch
      checked={optimistic}
      aria-label={`Show ${name} in the shop`}
      onCheckedChange={(next) =>
        startTransition(async () => {
          setOptimistic(next);
          const result = await setPublished(productId, next);
          if (result.ok)
            toast(next ? `${name} is in the shop.` : `${name} is hidden.`);
          else toast.error(errorMessage(result.error));
        })
      }
    />
  );
}
