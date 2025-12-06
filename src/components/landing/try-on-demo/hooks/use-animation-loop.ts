import { useMemo } from "react";

export type AnimationPhase =
  | "idle"
  | "scanning"
  | "processing"
  | "complete"
  | "reset";

const LOOP_DURATION = 12;

const getPhase = (time: number): AnimationPhase => {
  const t = time % LOOP_DURATION;
  if (t < 2) return "idle";
  if (t < 4) return "scanning";
  if (t < 7) return "processing";
  if (t < 10) return "complete";
  return "reset";
};

const getPhaseProgress = (time: number): number => {
  const t = time % LOOP_DURATION;
  if (t < 2) return t / 2;
  if (t < 4) return (t - 2) / 2;
  if (t < 7) return (t - 4) / 3;
  if (t < 10) return (t - 7) / 3;
  return (t - 10) / 2;
};

export const useAnimationLoop = (elapsedTime: number) => {
  return useMemo(
    () => ({
      phase: getPhase(elapsedTime),
      progress: getPhaseProgress(elapsedTime),
      loopProgress: (elapsedTime % LOOP_DURATION) / LOOP_DURATION,
    }),
    [elapsedTime]
  );
};
