"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/** A page failed to load. Server error details stay in the server logs. */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-danger-bg text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">This page didn&apos;t load</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Something went wrong while talking to the ReThread server. Try again,
          and if it keeps happening, tell the tech team
          {error.digest ? (
            <>
              {" "}
              and quote <span className="font-mono">{error.digest}</span>
            </>
          ) : null}
          .
        </p>
      </div>
      <Button onClick={reset}>
        <RotateCw />
        Try again
      </Button>
    </div>
  );
}
