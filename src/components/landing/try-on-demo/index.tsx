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

import {
  DEMO_TRY_ON_RESULT_1_URL,
  DEMO_TRY_ON_RESULT_2_URL,
  DEMO_YOUR_PHOTO_1_URL,
  DEMO_YOUR_PHOTO_2_URL,
  GARMENT_DEMO_URL,
} from "@/constants/demo";
import type { AnimationPhase } from "./hooks/use-animation-loop";
import { LOOP_DURATION, useAnimationLoop } from "./hooks/use-animation-loop";
import { useElapsedTime } from "./hooks/use-elapsed-time";
import { useReducedMotion } from "./hooks/use-reduced-motion";

const easing = [0.16, 1, 0.3, 1] as const;

type IconCardProps = {
  type: "user" | "shirt";
  phase: AnimationPhase;
  progress: number;
  reducedMotion: boolean;
  children?: React.ReactNode;
  label: React.ReactNode;
  imageSrc?: string;
};

const IconCard = ({
  type,
  phase,
  progress,
  reducedMotion,
  children,
  label,
  imageSrc,
}: IconCardProps) => {
  const isUser = type === "user";

  const getTransform = () => {
    if (reducedMotion) return {};

    const baseRotateY = isUser ? 6 : -6;

    switch (phase) {
      case "idle":
        return {
          rotateY: baseRotateY,
          translateZ: 10,
          scale: 1,
        };
      case "scanning":
        return {
          rotateY: baseRotateY * 0.3,
          translateZ: 15,
          scale: 1.02,
        };
      case "processing":
        return {
          rotateY: 0,
          translateZ: 5,
          scale: 0.98,
        };
      case "complete":
        return {
          rotateY: 0,
          translateZ: 0,
          scale: 0.95,
        };
      case "reset":
        return {
          rotateY: baseRotateY * progress,
          translateZ: 10 * progress,
          scale: 0.95 + 0.05 * progress,
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
          className={`relative h-48 w-36 overflow-hidden rounded-xl border-2 bg-gradient-to-b from-muted/80 via-card to-card/95 shadow-xl backdrop-blur-sm transition-all duration-500 md:h-64 md:w-48 dark:from-muted/80 dark:via-card dark:to-card/90 ${showGlow ? "border-accent/60 dark:border-accent/60" : "border-border/80 shadow-md dark:border-border/60"}
          `}
          style={{
            boxShadow: showGlow
              ? "0 0 30px -5px var(--accent), 0 20px 40px -15px rgba(0,0,0,0.3)"
              : "0 20px 40px -15px rgba(0,0,0,0.3)",
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
          <div className="absolute inset-0 flex items-center justify-center text-black">
            <motion.div
              animate={
                !reducedMotion && phase === "idle"
                  ? { scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }
                  : { scale: 1, opacity: showGlow ? 0.7 : 0.6 }
              }
              className="h-full w-full"
              transition={{
                duration: 3,
                ease: "easeInOut",
                repeat: phase === "idle" ? Number.POSITIVE_INFINITY : 0,
              }}
            >
              {imageSrc ? (
                <img
                  alt={type === "user" ? "User photo" : "Garment"}
                  className="h-full w-full object-cover transition-opacity duration-500"
                  src={imageSrc}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {children}
                </div>
              )}
            </motion.div>
          </div>

          {/* Bottom gradient label */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card via-card/80 to-transparent p-4 backdrop-blur-sm">
            <p className="font-medium text-foreground text-xs uppercase tracking-widest dark:text-foreground/90">
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
          className={`-top-3 -right-3 absolute flex h-10 w-10 items-center justify-center rounded-xl border bg-card/95 shadow-lg backdrop-blur-sm transition-colors duration-500 dark:bg-card/95 ${showGlow ? "border-accent/50" : "border-border dark:border-border"}
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
    <div className="relative flex flex-col items-center gap-2">
      {/* Top connector line */}
      <motion.div
        animate={{
          scaleY: isActive ? 1 : 0.5,
          opacity: isActive ? 1 : 0.3,
        }}
        className="h-6 w-px origin-bottom bg-gradient-to-b from-transparent to-border dark:to-border"
        transition={{ duration: 0.5, ease: easing }}
      />

      {/* Wand container */}
      <motion.div
        animate={{ scale: getScale() }}
        className={`relative flex h-14 w-14 items-center justify-center rounded-xl border bg-gradient-to-br from-card via-muted/30 to-muted/60 shadow-xl backdrop-blur-sm transition-all duration-500 dark:from-card dark:via-card dark:to-muted/50 ${isActive ? "border-accent/50" : "border-border/80 dark:border-border/50"}
        `}
        style={{
          boxShadow: isActive
            ? "0 0 40px -10px var(--accent), 0 10px 30px -10px rgba(0,0,0,0.3)"
            : "0 10px 30px -10px rgba(0,0,0,0.3)",
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

      {/* Bottom connector line */}
      <motion.div
        animate={{
          scaleY: isActive ? 1 : 0.5,
          opacity: isActive ? 1 : 0.3,
        }}
        className="h-6 w-px origin-top bg-gradient-to-b from-border to-transparent dark:from-border"
        transition={{ duration: 0.5, ease: easing }}
      />
    </div>
  );
};

type ResultCardProps = {
  phase: AnimationPhase;
  reducedMotion: boolean;
  imageSrc?: string;
};

const ResultCard = ({ phase, reducedMotion, imageSrc }: ResultCardProps) => {
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
          className="-m-3 absolute inset-0 rounded-xl"
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
      )}

      {/* Card */}
      <div
        className={`relative h-48 w-36 overflow-hidden rounded-xl border-2 bg-gradient-to-b from-accent/20 via-card/95 to-card shadow-2xl backdrop-blur-sm transition-all duration-500 md:h-64 md:w-48 ${isComplete ? "border-accent" : "border-accent/60 dark:border-accent/40"}
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
          {(() => {
            if (isComplete && imageSrc) {
              return (
                <motion.div
                  animate={{ opacity: 1 }}
                  className="h-full w-full"
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <img
                    alt="Try-on Result"
                    className="h-full w-full object-cover"
                    src={imageSrc}
                  />
                </motion.div>
              );
            }
            if (isComplete) {
              return (
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
              );
            }
            return (
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
            );
          })()}
        </div>

        {/* Bottom label */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-card via-card/80 to-transparent p-4 backdrop-blur-sm">
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
        return <Trans>~20s processing with Gemini 3.0</Trans>;
    }
  };

  const isActive =
    phase === "scanning" || phase === "processing" || phase === "complete";

  return (
    <motion.div
      animate={
        !reducedMotion && isActive
          ? { scale: [1, 1.02, 1], opacity: [0.9, 1, 0.9] }
          : { scale: 1, opacity: isActive ? 1 : 0.6 }
      }
      className={`mt-4 flex items-center justify-center gap-2 rounded-full px-4 py-2 transition-all duration-500 ${isActive ? "text-accent" : "text-muted-foreground"}
      `}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    >
      <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
      <span className="font-medium text-xs tracking-wide">{getMessage()}</span>
    </motion.div>
  );
};

export const TryOnDemo = () => {
  const reducedMotion = useReducedMotion();
  const { elapsed } = useElapsedTime(reducedMotion);
  const { phase, progress } = useAnimationLoop(elapsed);

  // Determine loop index based on total elapsed time and loop duration
  // We want to switch sets every full loop
  const loopIndex = Math.floor(elapsed / LOOP_DURATION);
  const isSecondSet = loopIndex % 2 === 1;

  const currentProfile = isSecondSet
    ? DEMO_YOUR_PHOTO_2_URL
    : DEMO_YOUR_PHOTO_1_URL;
  const currentResult = isSecondSet
    ? DEMO_TRY_ON_RESULT_2_URL
    : DEMO_TRY_ON_RESULT_1_URL;

  return (
    <div className="relative mx-auto w-full" style={{ perspective: "1200px" }}>
      {/* Screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {phase === "scanning" && "Scanning photo and garment"}
        {phase === "processing" && "AI processing virtual try-on"}
        {phase === "complete" && "Virtual try-on complete"}
      </div>

      {/* Demo content - vertical flex column layout */}
      <div
        aria-label="Interactive demonstration showing how AI combines your photo with any garment to create a virtual try-on result"
        className="relative flex flex-col items-center gap-4"
        role="img"
        style={{
          transformStyle: "preserve-3d",
          transform: reducedMotion ? "none" : "rotateX(2deg)",
        }}
      >
        {/* Input cards row */}
        <div
          className="flex items-center justify-center gap-4"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* User photo card */}
          <IconCard
            imageSrc={currentProfile}
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
            className={`flex h-10 w-10 items-center justify-center rounded-full border bg-muted/80 font-light text-2xl shadow-md backdrop-blur-sm transition-colors duration-500 dark:bg-card/80 ${phase === "scanning" || phase === "processing" ? "border-accent/50 text-accent" : "border-border/80 text-muted-foreground dark:border-border"}
            `}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            +
          </motion.div>

          {/* Garment card */}
          <IconCard
            imageSrc={GARMENT_DEMO_URL}
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
        </div>

        {/* Wand connector - centered below inputs */}
        <WandConnector phase={phase} reducedMotion={reducedMotion} />

        {/* Result card - below wand */}
        <ResultCard
          imageSrc={currentResult}
          phase={phase}
          reducedMotion={reducedMotion}
        />

        {/* Processing badge */}
        <ProcessingBadge phase={phase} reducedMotion={reducedMotion} />
      </div>
    </div>
  );
};
