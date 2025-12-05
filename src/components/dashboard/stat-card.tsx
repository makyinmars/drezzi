import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: number;
  icon: LucideIcon;
  suffix?: string;
  description?: string;
  variant?: "default" | "large" | "wide";
  accentColor?: string;
  index?: number;
};

function useAnimatedCounter(end: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const startValue = countRef.current;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: ease-out cubic
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(startValue + (end - startValue) * eased);

      setCount(current);
      countRef.current = current;

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration]);

  return count;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  suffix = "",
  description,
  variant = "default",
  accentColor = "#d4a574",
  index = 0,
}: StatCardProps) {
  const animatedValue = useAnimatedCounter(value);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all duration-500 hover:shadow-lg",
        "fade-in slide-in-from-bottom-4 animate-in fill-mode-both",
        variant === "large" && "row-span-2 p-8",
        variant === "wide" && "col-span-2"
      )}
      style={{
        animationDelay: `${index * 100}ms`,
        animationDuration: "600ms",
      }}
    >
      {/* Accent gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${accentColor}08 0%, transparent 50%)`,
        }}
      />

      {/* Icon with accent background */}
      <div
        className="mb-4 inline-flex rounded-xl p-3 transition-transform duration-300 group-hover:scale-110"
        style={{
          backgroundColor: `${accentColor}15`,
        }}
      >
        <Icon
          className="h-5 w-5 transition-colors duration-300"
          style={{ color: accentColor }}
        />
      </div>

      {/* Value with bold typography */}
      <div className="relative">
        <p
          className={cn(
            "font-bold text-foreground tracking-tight transition-all duration-300",
            variant === "large" ? "text-6xl" : "text-4xl"
          )}
        >
          {animatedValue.toLocaleString()}
          {suffix && (
            <span className="ml-1 font-medium text-2xl text-muted-foreground">
              {suffix}
            </span>
          )}
        </p>
      </div>

      {/* Title */}
      <p className="mt-2 font-medium text-muted-foreground text-sm tracking-wide">
        {title}
      </p>

      {/* Optional description */}
      {description && (
        <p className="mt-1 text-muted-foreground/70 text-xs">{description}</p>
      )}

      {/* Decorative corner accent */}
      <div
        className="-right-8 -top-8 pointer-events-none absolute h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-20"
        style={{ backgroundColor: accentColor }}
      />
    </div>
  );
}
