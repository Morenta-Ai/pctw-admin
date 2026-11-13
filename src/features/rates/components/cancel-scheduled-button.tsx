"use client";

import { Loader2, X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { errorMessage } from "@/core/api/api-error";
import { cancelScheduledRates } from "@/features/rates/actions";

export function CancelScheduledButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await cancelScheduledRates();
          if (result.ok) toast("Scheduled change cancelled.");
          else toast.error(errorMessage(result.error));
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <X />}
      Cancel change
    </Button>
  );
}
