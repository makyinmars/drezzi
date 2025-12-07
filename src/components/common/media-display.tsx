import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MediaDisplayProps = {
  src?: string;
  alt?: string;
  className?: string;
  fit?: "contain" | "cover";
  variant?: "page" | "card";
  aspectRatio?: "4/5" | "3/4" | "3/2";
  children?: ReactNode;
};

const aspectClasses = {
  "4/5": "aspect-4/5",
  "3/4": "aspect-3/4",
  "3/2": "aspect-3/2",
};

export default function MediaDisplay({
  src,
  alt,
  className,
  fit = "contain",
  variant = "page",
  aspectRatio = "4/5",
  children,
}: MediaDisplayProps) {
  const isCard = variant === "card";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-muted",
        isCard
          ? aspectClasses[aspectRatio]
          : "max-h-[70vh] md:max-h-[80vh] lg:max-h-[85vh]",
        className
      )}
    >
      {src && (
        <img
          alt={alt ?? ""}
          className={cn(
            "h-full w-full",
            fit === "contain" ? "object-contain" : "object-cover"
          )}
          loading="lazy"
          src={src}
        />
      )}
      {children}
    </div>
  );
}
