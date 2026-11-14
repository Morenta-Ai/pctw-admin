"use client";

import { CheckCheck, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { errorMessage } from "@/core/api/api-error";
import { markAllNotificationsRead } from "@/features/notifications/actions";
import { NOTIFICATIONS_CHANGED } from "@/features/notifications/data/models";

export function MarkAllReadButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await markAllNotificationsRead();
          if (result.ok) window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
          else toast.error(errorMessage(result.error));
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <CheckCheck />}
      Mark all read
    </Button>
  );
}
