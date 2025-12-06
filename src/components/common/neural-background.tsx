import { cn } from "@/lib/utils";

type NeuralBackgroundProps = {
  className?: string;
  opacity?: number;
  showGlow?: boolean;
};

export const NeuralBackground = ({
  className,
  opacity = 15,
  showGlow = true,
}: NeuralBackgroundProps) => {
  return (
    <>
      {/* Neural pattern background with animated dots */}
      <div
        className={cn("absolute inset-0", className)}
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, var(--primary) 1.5px, transparent 1.5px),
            radial-gradient(circle at 75% 75%, var(--muted-foreground) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, var(--primary) 0.5px, transparent 0.5px)
          `,
          backgroundSize: "60px 60px, 60px 60px, 30px 30px",
          animation: "tech-neural-flow 30s linear infinite",
          opacity: opacity / 100,
        }}
      />

      {/* Radial glow from center */}
      {showGlow && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 50%,
              color-mix(in oklch, var(--primary) 15%, transparent) 0%,
              transparent 60%
            )`,
          }}
        />
      )}
    </>
  );
};
