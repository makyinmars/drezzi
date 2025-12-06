import { useCallback, useEffect, useRef, useState } from "react";

export const useElapsedTime = (paused = false) => {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(performance.now());
  const frameRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  useEffect(() => {
    if (paused) {
      pausedAtRef.current = elapsed;
      cancelAnimationFrame(frameRef.current);
      return;
    }

    // Adjust start time to account for time spent paused
    startRef.current = performance.now() - pausedAtRef.current * 1000;

    const tick = () => {
      setElapsed((performance.now() - startRef.current) / 1000);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [paused, elapsed]);

  const reset = useCallback(() => {
    startRef.current = performance.now();
    pausedAtRef.current = 0;
    setElapsed(0);
  }, []);

  return { elapsed, reset };
};
