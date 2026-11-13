import { Shirt } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/** A product's cover photo, or a placeholder tile. */
export function ProductThumb({
  url,
  name,
  className,
}: {
  url?: string;
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-primary",
        className,
      )}
    >
      {url ? (
        // Unoptimised: mock uploads are served behind the session cookie,
        // which Next's image optimiser wouldn't send.
        <Image src={url} alt={name} fill unoptimized className="object-cover" />
      ) : (
        <Shirt className="size-1/2" aria-hidden />
      )}
    </span>
  );
}
