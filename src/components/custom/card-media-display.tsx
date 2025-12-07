import type { MouseEvent, PointerEvent, ReactNode } from "react";
import { useRef } from "react";

import MediaDisplay from "@/components/common/media-display";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardMediaDisplayProps = {
  imageUrl?: string | null;
  alt?: string;
  aspectRatio?: "4/5" | "3/4" | "3/2";
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomLeft?: ReactNode;
  bottomRight?: ReactNode;
  customMedia?: ReactNode;
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
  bottomLeft,
  bottomRight,
  customMedia,
  onClick,
  className,
  children,
}: CardMediaDisplayProps) {
  const pointerDownRef = useRef<EventTarget | null>(null);

  const handlePointerDown = (e: PointerEvent) => {
    pointerDownRef.current = e.target;
  };

  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const pointerDownTarget = pointerDownRef.current as HTMLElement | null;
    pointerDownRef.current = null;

    // Skip if click originated from overlay
    if (target.closest("[data-card-overlay]")) {
      return;
    }

    // Skip if pointerdown didn't happen inside this card
    // (e.g., it happened in a Portal that was then removed)
    const card = e.currentTarget as HTMLElement;
    if (!(pointerDownTarget && card.contains(pointerDownTarget))) {
      return;
    }

    onClick?.();
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border border-border bg-card pt-0 transition-all duration-200 hover:border-foreground/20 hover:shadow-lg",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick ? handleClick : undefined}
      onPointerDown={onClick ? handlePointerDown : undefined}
    >
      <div className="relative">
        {topLeft && (
          <div className="absolute top-3 left-3 z-10" data-card-overlay>
            {topLeft}
          </div>
        )}

        {topRight && (
          <div className="absolute top-3 right-3 z-10" data-card-overlay>
            {topRight}
          </div>
        )}

        {bottomLeft && (
          <div className="absolute bottom-3 left-3 z-10" data-card-overlay>
            {bottomLeft}
          </div>
        )}

        {bottomRight && (
          <div className="absolute right-3 bottom-3 z-10" data-card-overlay>
            {bottomRight}
          </div>
        )}

        {customMedia ? (
          <div
            className={cn(
              "overflow-hidden",
              aspectRatio === "4/5" && "aspect-4/5",
              aspectRatio === "3/4" && "aspect-3/4",
              aspectRatio === "3/2" && "aspect-3/2"
            )}
          >
            {customMedia}
          </div>
        ) : (
          <MediaDisplay
            alt={alt}
            aspectRatio={aspectRatio}
            className="transition-transform duration-300 group-hover:scale-105"
            fit="cover"
            src={imageUrl ?? undefined}
            variant="card"
          />
        )}
      </div>

      {children && <div className="p-2">{children}</div>}
    </Card>
  );
}
