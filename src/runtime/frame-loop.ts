export type AnimationFrameLoop = {
  readonly running: boolean;
  reset(): void;
  start(): void;
  stop(): void;
};

export function createAnimationFrameLoop(
  onFrame: (now: number, deltaMilliseconds: number) => void,
  now: () => number = () => performance.now()
): AnimationFrameLoop {
  let previousTime = now();
  let animationFrameId = 0;
  let isRunning = false;

  const frame = (currentTime: number): void => {
    if (!isRunning) return;

    const deltaMilliseconds = currentTime - previousTime;
    previousTime = currentTime;
    onFrame(currentTime, deltaMilliseconds);
    animationFrameId = requestAnimationFrame(frame);
  };

  return {
    get running(): boolean {
      return isRunning;
    },
    reset(): void {
      previousTime = now();
    },
    start(): void {
      previousTime = now();
      if (isRunning) return;

      isRunning = true;
      animationFrameId = requestAnimationFrame(frame);
    },
    stop(): void {
      if (!isRunning) return;

      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }
  };
}
