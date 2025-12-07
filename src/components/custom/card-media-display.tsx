import { Trans } from "@lingui/react/macro";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardMediaDisplayProps = {
  imageUrl?: string | null;
  alt?: string;
  aspectRatio?: "4/5" | "3/4" | "3/2";
  title: string;
  subtitle?: string | null;
  note?: string | null;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  onClick?: () => void;
  className?: string;
};

const aspectClasses = {
  "4/5": "aspect-[4/5]",
  "3/4": "aspect-[3/4]",
  "3/2": "aspect-[3/2]",
};

export default function CardMediaDisplay({
  imageUrl,
  alt,
  aspectRatio = "4/5",
  title,
  subtitle,
  note,
  topLeft,
  topRight,
  onClick,
  className,
}: CardMediaDisplayProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border border-border bg-card pt-0 transition-all duration-200 hover:border-foreground/20 hover:shadow-lg",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {topLeft && (
        <div className="absolute top-3 left-3 z-10 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          {topLeft}
        </div>
      )}

      {topRight && (
        <div className="absolute top-3 right-3 z-10 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          {topRight}
        </div>
      )}

      <div
        className={cn("overflow-hidden bg-muted", aspectClasses[aspectRatio])}
      >
        {imageUrl ? (
          <img
            alt={alt ?? title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            src={imageUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
            <Trans>No image</Trans>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="truncate font-medium text-foreground">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-muted-foreground text-sm">{subtitle}</p>
        )}
        {note ? (
          <p className="mt-2 line-clamp-2 text-muted-foreground text-sm">
            {note}
          </p>
        ) : (
          <p className="mt-2 text-muted-foreground/50 text-sm italic">
            <Trans>No note</Trans>
          </p>
        )}
      </div>
    </Card>
  );
}
