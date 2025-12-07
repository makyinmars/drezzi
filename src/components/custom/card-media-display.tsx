import type { ReactNode } from "react";

import MediaDisplay from "@/components/common/media-display";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardMediaDisplayProps = {
  imageUrl?: string | null;
  alt?: string;
  aspectRatio?: "4/5" | "3/4" | "3/2";
  topLeft?: ReactNode;
  topRight?: ReactNode;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
};

export default function CardMediaDisplay({
  imageUrl,
  alt,
  aspectRatio = "4/5",
  topLeft,
  topRight,
  onClick,
  className,
  children,
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
      {topLeft && <div className="absolute top-3 left-3 z-10">{topLeft}</div>}

      {topRight && (
        <div className="absolute top-3 right-3 z-10">{topRight}</div>
      )}

      <MediaDisplay
        alt={alt}
        aspectRatio={aspectRatio}
        className="transition-transform duration-300 group-hover:scale-105"
        fit="cover"
        src={imageUrl ?? undefined}
        variant="card"
      />

      {children && <div className="p-2">{children}</div>}
    </Card>
  );
}
