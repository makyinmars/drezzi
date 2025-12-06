import { useCallback, useEffect, useRef, useState } from "react";

export const useElapsedTime = (paused = false) => {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(performance.now());
  const frameRef = useRef<number>(0);
  const pausedTimeRef = useRef(0);
  const wasPausedRef = useRef(paused);

  useEffect(() => {
    // Handle transition from not-paused to paused
    if (paused && !wasPausedRef.current) {
      pausedTimeRef.current = performance.now() - startRef.current;
      wasPausedRef.current = true;
      cancelAnimationFrame(frameRef.current);
      return;
    }

    // Handle transition from paused to not-paused
    if (!paused && wasPausedRef.current) {
      startRef.current = performance.now() - pausedTimeRef.current;
      wasPausedRef.current = false;
    }

    if (paused) return;

    const tick = () => {
      setElapsed((performance.now() - startRef.current) / 1000);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [paused]);

  const reset = useCallback(() => {
    startRef.current = performance.now();
    pausedTimeRef.current = 0;
    setElapsed(0);
  }, []);

  return { elapsed, reset };
};
