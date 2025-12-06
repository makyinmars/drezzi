import { Trans } from "@lingui/react/macro";
import {
  CheckCircle,
  Clock,
  ImageIcon,
  Shirt,
  Sparkles,
  User,
  Wand2,
} from "lucide-react";
import { motion } from "motion/react";

import type { AnimationPhase } from "./hooks/use-animation-loop";
import { useAnimationLoop } from "./hooks/use-animation-loop";
import { useElapsedTime } from "./hooks/use-elapsed-time";
import { useReducedMotion } from "./hooks/use-reduced-motion";

const easing = [0.16, 1, 0.3, 1] as const;

type IconCardProps = {
  type: "user" | "shirt";
  phase: AnimationPhase;
  progress: number;
  reducedMotion: boolean;
  children: React.ReactNode;
  label: React.ReactNode;
};

const IconCard = ({
  type,
  phase,
  progress,
  reducedMotion,
  children,
  label,
}: IconCardProps) => {
  const isUser = type === "user";

  const getTransform = () => {
    if (reducedMotion) return {};

    const baseRotateY = isUser ? 8 : -8;

    switch (phase) {
      case "idle":
        return {
          rotateY: baseRotateY,
          translateZ: 15,
          translateX: 0,
          scale: 1,
        };
      case "scanning":
        return {
          rotateY: baseRotateY * 0.5,
          translateZ: 20,
          translateX: 0,
          scale: 1.02,
        };
      case "processing":
        return {
          rotateY: 0,
          translateZ: 5,
          translateX: isUser ? 30 : -30,
          scale: 0.95,
        };
      case "complete":
        return {
          rotateY: 0,
          translateZ: 0,
          translateX: isUser ? 50 : -50,
          scale: 0.9,
        };
      case "reset":
        return {
          rotateY: baseRotateY * progress,
          translateZ: 15 * progress,
          translateX: (isUser ? 50 : -50) * (1 - progress),
          scale: 0.9 + 0.1 * progress,
        };
      default:
        return {};
    }
  };

  const getOpacity = () => {
    switch (phase) {
      case "idle":
      case "scanning":
        return 1;
      case "processing":
        return 0.7;
      case "complete":
        return 0.5;
      case "reset":
        return 0.5 + 0.5 * progress;
      default:
        return 1;
    }
  };

  const transform = getTransform();
  const showScanLine = phase === "scanning";
  const showGlow = phase === "scanning" || phase === "processing";

  return (
    <motion.div
      animate={{
        rotateY: transform.rotateY,
        z: transform.translateZ,
        x: transform.translateX,
        scale: transform.scale,
      }}
      className="group relative"
      style={{
        transformStyle: "preserve-3d",
        opacity: getOpacity(),
      }}
      transition={{ duration: 0.8, ease: easing }}
    >
      {/* Floating animation wrapper */}
      <motion.div
        animate={
          !reducedMotion && (phase === "idle" || phase === "reset")
            ? {
                y: [0, -10, 0],
              }
            : { y: 0 }
        }
        transition={{
          duration: 4,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
          delay: isUser ? 0 : 0.5,
        }}
      >
        {/* Card */}
        <div
          className={`relative h-48 w-36 overflow-hidden rounded-2xl border-2 bg-gradient-to-b from-muted/80 via-card to-card/90 shadow-xl backdrop-blur-sm transition-all duration-500 md:h-64 md:w-48 ${showGlow ? "border-accent/60" : "border-border/60"}
          `}
          style={{
            boxShadow: showGlow
              ? "0 0 30px -5px var(--accent), 0 20px 40px -15px rgba(0,0,0,0.3)"
              : "0 20px 40px -15px rgba(0,0,0,0.2)",
          }}
        >
          {/* Shimmer overlay during scanning */}
          {showScanLine && !reducedMotion && (
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--accent) 15%, transparent) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "demo-shimmer 2s linear infinite",
              }}
            />
          )}

          {/* Scan line */}
          {showScanLine && !reducedMotion && (
            <div
              className="pointer-events-none absolute inset-x-0 z-20 h-1"
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, var(--accent) 50%, transparent 100%)",
                boxShadow: "0 0 20px 5px var(--accent)",
                animation: "demo-scan-line 2s ease-in-out infinite",
              }}
            />
          )}

          {/* Icon container */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={
                !reducedMotion && phase === "idle"
                  ? { scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }
                  : { scale: 1, opacity: showGlow ? 0.7 : 0.4 }
              }
              transition={{
                duration: 3,
                ease: "easeInOut",
                repeat: phase === "idle" ? Number.POSITIVE_INFINITY : 0,
              }}
            >
              {children}
            </motion.div>
          </div>

          {/* Bottom gradient label */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/60 to-transparent p-4">
            <p className="font-medium text-foreground/90 text-xs uppercase tracking-widest">
              {label}
            </p>
          </div>

          {/* Decorative corner accent */}
          <div
            className={`absolute top-0 right-0 h-12 w-12 bg-gradient-to-bl from-accent/20 to-transparent transition-opacity duration-500 ${showGlow ? "opacity-100" : "opacity-0"}
            `}
          />
        </div>

        {/* Floating badge */}
        <motion.div
          animate={
            reducedMotion
              ? {}
              : { scale: [1, 1.1, 1], rotate: showGlow ? [0, 5, 0] : 0 }
          }
          className={`-top-3 -right-3 absolute flex h-10 w-10 items-center justify-center rounded-xl border bg-card/95 shadow-lg backdrop-blur-sm transition-colors duration-500 ${showGlow ? "border-accent/50" : "border-border"}
          `}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: isUser ? 0 : 0.3,
          }}
        >
          {isUser ? (
            <ImageIcon className="h-4 w-4 text-accent" strokeWidth={1.5} />
          ) : (
            <Shirt className="h-4 w-4 text-accent" strokeWidth={1.5} />
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

type WandConnectorProps = {
  phase: AnimationPhase;
  reducedMotion: boolean;
};

const WandConnector = ({ phase, reducedMotion }: WandConnectorProps) => {
  const isActive = phase === "scanning" || phase === "processing";
  const isProcessing = phase === "processing";

  const getScale = () => {
    if (isProcessing) return 1.15;
    if (isActive) return 1.05;
    return 1;
  };

  const getWandAnimation = () => {
    if (reducedMotion) return {};
    if (isProcessing) return { rotate: 360 };
    if (phase === "scanning") return { rotate: [0, 15, -10, 0] };
    return { rotate: 0 };
  };

  return (
    <div className="relative flex items-center gap-2 md:gap-4">
      {/* Left connector line */}
      <motion.div
        animate={{
          scaleX: isActive ? 1 : 0.5,
          opacity: isActive ? 1 : 0.3,
        }}
        className="hidden h-px w-8 origin-right bg-gradient-to-r from-transparent to-border md:block"
        transition={{ duration: 0.5, ease: easing }}
      />

      {/* Wand container */}
      <motion.div
        animate={{ scale: getScale() }}
        className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-br from-card via-card to-muted/50 shadow-xl backdrop-blur-sm transition-all duration-500 ${isActive ? "border-accent/50" : "border-border/50"}
        `}
        style={{
          boxShadow: isActive
            ? "0 0 40px -10px var(--accent), 0 10px 30px -10px rgba(0,0,0,0.3)"
            : "0 10px 30px -10px rgba(0,0,0,0.2)",
        }}
        transition={{ duration: 0.5, ease: easing }}
      >
        {/* Orbiting particles */}
        {isProcessing && !reducedMotion && (
          <>
            <div
              className="absolute h-2 w-2 rounded-full bg-accent"
              style={{
                animation: "demo-particle-orbit 1.5s linear infinite",
              }}
            />
            <div
              className="absolute h-1.5 w-1.5 rounded-full bg-accent/70"
              style={{
                animation: "demo-particle-orbit 1.5s linear infinite 0.5s",
              }}
            />
            <div
              className="absolute h-1 w-1 rounded-full bg-accent/50"
              style={{
                animation: "demo-particle-orbit 1.5s linear infinite 1s",
              }}
            />
          </>
        )}

        {/* Wand icon */}
        <motion.div
          animate={getWandAnimation()}
          transition={
            isProcessing
              ? {
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }
              : { duration: 1.5, repeat: Number.POSITIVE_INFINITY }
          }
        >
          <Wand2
            className={`h-6 w-6 transition-colors duration-500 ${
              isActive ? "text-accent" : "text-muted-foreground"
            }`}
            strokeWidth={1.5}
          />
        </motion.div>
      </motion.div>

      {/* Right connector line */}
      <motion.div
        animate={{
          scaleX: isActive ? 1 : 0.5,
          opacity: isActive ? 1 : 0.3,
        }}
        className="hidden h-px w-8 origin-left bg-gradient-to-r from-border to-transparent md:block"
        transition={{ duration: 0.5, ease: easing }}
      />
    </div>
  );
};

type ResultCardProps = {
  phase: AnimationPhase;
  reducedMotion: boolean;
};

const ResultCard = ({ phase, reducedMotion }: ResultCardProps) => {
  const isVisible = phase === "processing" || phase === "complete";
  const isComplete = phase === "complete";

  return (
    <motion.div
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0.7,
        rotateY: isVisible ? 0 : 90,
        z: isComplete ? 40 : 20,
      }}
      className="relative"
      initial={{ opacity: 0, scale: 0.7, rotateY: 90 }}
      style={{ transformStyle: "preserve-3d" }}
      transition={{ duration: 0.8, ease: easing }}
    >
      {/* Glow ring */}
      {isComplete && !reducedMotion && (
        <motion.div
          animate={{
            boxShadow: [
              "0 0 30px 0px var(--accent), 0 0 60px -10px var(--accent)",
              "0 0 50px 10px var(--accent), 0 0 100px 0px var(--accent)",
              "0 0 30px 0px var(--accent), 0 0 60px -10px var(--accent)",
            ],
          }}
          className="-m-3 absolute inset-0 rounded-3xl"
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
      )}

      {/* Card */}
      <div
        className={`relative h-48 w-36 overflow-hidden rounded-2xl border-2 bg-gradient-to-b from-accent/10 via-card to-card/95 shadow-2xl backdrop-blur-sm transition-all duration-500 md:h-64 md:w-48 ${isComplete ? "border-accent" : "border-accent/40"}
        `}
      >
        {/* Success sparkles background */}
        {isComplete && !reducedMotion && (
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                }}
                className="absolute h-1 w-1 rounded-full bg-accent"
                key={i}
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}

        {/* Icon container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isComplete ? (
            <motion.div
              animate={{ scale: 1, rotate: 0 }}
              initial={{ scale: 0, rotate: -180 }}
              transition={{ duration: 0.6, ease: easing, delay: 0.2 }}
            >
              <CheckCircle
                className="h-20 w-20 text-accent md:h-24 md:w-24"
                strokeWidth={1}
              />
            </motion.div>
          ) : (
            <motion.div
              animate={reducedMotion ? {} : { rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              <Sparkles
                className="h-20 w-20 text-accent/70 md:h-24 md:w-24"
                strokeWidth={1}
              />
            </motion.div>
          )}
        </div>

        {/* Bottom label */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/60 to-transparent p-4">
          <p className="font-semibold text-accent text-xs uppercase tracking-widest">
            <Trans>AI Result</Trans>
          </p>
        </div>

        {/* Success badge */}
        {isComplete && (
          <motion.div
            animate={{ scale: 1, rotate: 0 }}
            className="-top-3 -right-3 absolute flex h-10 w-10 items-center justify-center rounded-xl border border-accent bg-accent/20 shadow-lg backdrop-blur-sm"
            initial={{ scale: 0, rotate: -180 }}
            transition={{ duration: 0.5, ease: easing, delay: 0.4 }}
          >
            <CheckCircle className="h-5 w-5 text-accent" strokeWidth={2} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

type ProcessingBadgeProps = {
  phase: AnimationPhase;
  reducedMotion: boolean;
};

const ProcessingBadge = ({ phase, reducedMotion }: ProcessingBadgeProps) => {
  const getMessage = () => {
    switch (phase) {
      case "scanning":
        return <Trans>Analyzing images...</Trans>;
      case "processing":
        return <Trans>AI generating try-on...</Trans>;
      case "complete":
        return <Trans>Try-on complete!</Trans>;
      default:
        return <Trans>~10s processing with Gemini 2.0</Trans>;
    }
  };

  const isActive =
    phase === "scanning" || phase === "processing" || phase === "complete";

  return (
    <motion.div
      animate={
        !reducedMotion && isActive
          ? { scale: [1, 1.02, 1], opacity: [0.8, 1, 0.8] }
          : { scale: 1, opacity: isActive ? 1 : 0.7 }
      }
      className={`mt-8 flex items-center justify-center gap-2 rounded-full border px-4 py-2 backdrop-blur-sm transition-all duration-500 ${isActive ? "border-accent/30 bg-accent/5" : "border-border/50 bg-card/50"}
      `}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    >
      <Clock
        className={`h-4 w-4 transition-colors duration-500 ${
          isActive ? "text-accent" : "text-muted-foreground"
        }`}
        strokeWidth={1.5}
      />
      <span
        className={`font-medium text-xs tracking-wide transition-colors duration-500 ${
          isActive ? "text-accent" : "text-muted-foreground"
        }`}
      >
        {getMessage()}
      </span>
    </motion.div>
  );
};

export const TryOnDemo = () => {
  const reducedMotion = useReducedMotion();
  const { elapsed } = useElapsedTime(reducedMotion);
  const { phase, progress } = useAnimationLoop(elapsed);

  return (
    <div
      className="relative mx-auto w-full max-w-4xl"
      style={{ perspective: "1200px" }}
    >
      {/* Screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {phase === "scanning" && "Scanning photo and garment"}
        {phase === "processing" && "AI processing virtual try-on"}
        {phase === "complete" && "Virtual try-on complete"}
      </div>

      {/* Main container with 3D scene */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-muted/50 via-background to-card/30 p-1.5 shadow-2xl">
        <div
          className="relative overflow-hidden rounded-2xl bg-background/80 p-8 backdrop-blur-sm md:p-12"
          style={{
            transformStyle: "preserve-3d",
            transform: reducedMotion ? "none" : "rotateX(2deg)",
          }}
        >
          {/* Animated grid background */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
            <motion.div
              animate={
                reducedMotion
                  ? {}
                  : { backgroundPosition: ["0px 0px", "40px 40px"] }
              }
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(var(--accent) 1px, transparent 1px),
                  linear-gradient(90deg, var(--accent) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
              transition={{
                duration: 20,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
              }}
            />
          </div>

          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 70%)",
            }}
          />

          {/* Demo content */}
          <div
            aria-label="Interactive demonstration showing how AI combines your photo with any garment to create a virtual try-on result"
            className="relative flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-8"
            role="img"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* User photo card */}
            <IconCard
              label={<Trans>Your Photo</Trans>}
              phase={phase}
              progress={progress}
              reducedMotion={reducedMotion}
              type="user"
            >
              <User
                className="h-20 w-20 text-muted-foreground md:h-24 md:w-24"
                strokeWidth={0.75}
              />
            </IconCard>

            {/* Plus operator */}
            <motion.div
              animate={
                reducedMotion
                  ? {}
                  : { scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }
              }
              className={`flex h-10 w-10 items-center justify-center rounded-full border bg-card/80 font-light text-2xl shadow-lg backdrop-blur-sm transition-colors duration-500 ${phase === "scanning" || phase === "processing" ? "border-accent/50 text-accent" : "border-border text-muted-foreground"}
              `}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              +
            </motion.div>

            {/* Garment card */}
            <IconCard
              label={<Trans>Any Garment</Trans>}
              phase={phase}
              progress={progress}
              reducedMotion={reducedMotion}
              type="shirt"
            >
              <Shirt
                className="h-20 w-20 text-muted-foreground md:h-24 md:w-24"
                strokeWidth={0.75}
              />
            </IconCard>

            {/* Wand connector */}
            <WandConnector phase={phase} reducedMotion={reducedMotion} />

            {/* Result card */}
            <ResultCard phase={phase} reducedMotion={reducedMotion} />
          </div>

          {/* Processing badge */}
          <ProcessingBadge phase={phase} reducedMotion={reducedMotion} />
        </div>
      </div>
    </div>
  );
};
