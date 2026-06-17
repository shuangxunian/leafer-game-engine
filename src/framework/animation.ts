export type SpriteFrame = {
  id: string;
  spriteId: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export type SpriteAnimationClip = {
  id: string;
  frameIds: string[];
  frameDurationSeconds?: number;
  loop?: boolean;
};

export type SpriteAnimationPlaybackStatus = "playing" | "paused" | "stopped" | "completed";

export type SpriteAnimationPlaybackState = {
  clipId: string;
  status: SpriteAnimationPlaybackStatus;
  elapsedSeconds: number;
  frameIndex: number;
  completedLoops: number;
};

export type SpriteAnimationPlaybackOptions = {
  frames?: readonly SpriteFrame[];
  elapsedSeconds?: number;
  startPaused?: boolean;
};

export type SpriteAnimationTimingOptions = {
  frames?: readonly SpriteFrame[];
};

export function defineSpriteFrame(frame: SpriteFrame): SpriteFrame {
  return { ...frame };
}

export function defineSpriteAnimationClip(clip: SpriteAnimationClip): SpriteAnimationClip {
  return {
    ...clip,
    frameIds: [...clip.frameIds]
  };
}

export function createSpriteAnimationPlayback(
  clip: SpriteAnimationClip,
  options: SpriteAnimationPlaybackOptions = {}
): SpriteAnimationPlaybackState {
  const elapsedSeconds = options.elapsedSeconds ?? 0;
  const timing = resolveSpriteAnimationTiming(clip, options);
  assertNonNegativeFinite(elapsedSeconds, "elapsedSeconds");
  const resolution = resolveSpriteAnimationPlaybackAt(clip, timing, elapsedSeconds);

  return {
    clipId: clip.id,
    status: resolution.completed ? "completed" : options.startPaused ? "paused" : "playing",
    elapsedSeconds: resolution.elapsedSeconds,
    frameIndex: resolution.frameIndex,
    completedLoops: resolution.completedLoops
  };
}

export function advanceSpriteAnimationPlayback(
  state: SpriteAnimationPlaybackState,
  clip: SpriteAnimationClip,
  deltaSeconds: number,
  options: SpriteAnimationTimingOptions = {}
): SpriteAnimationPlaybackState {
  assertStateMatchesClip(state, clip);
  assertNonNegativeFinite(deltaSeconds, "deltaSeconds");

  if (state.status !== "playing") {
    return { ...state };
  }

  const timing = resolveSpriteAnimationTiming(clip, options);
  const resolution = resolveSpriteAnimationPlaybackAt(clip, timing, state.elapsedSeconds + deltaSeconds);

  return {
    ...state,
    status: resolution.completed ? "completed" : "playing",
    elapsedSeconds: resolution.elapsedSeconds,
    frameIndex: resolution.frameIndex,
    completedLoops: resolution.completedLoops
  };
}

export function pauseSpriteAnimationPlayback(state: SpriteAnimationPlaybackState): SpriteAnimationPlaybackState {
  if (state.status !== "playing") {
    return { ...state };
  }

  return {
    ...state,
    status: "paused"
  };
}

export function resumeSpriteAnimationPlayback(state: SpriteAnimationPlaybackState): SpriteAnimationPlaybackState {
  if (state.status !== "paused") {
    return { ...state };
  }

  return {
    ...state,
    status: "playing"
  };
}

export function stopSpriteAnimationPlayback(state: SpriteAnimationPlaybackState): SpriteAnimationPlaybackState {
  return {
    clipId: state.clipId,
    status: "stopped",
    elapsedSeconds: 0,
    frameIndex: 0,
    completedLoops: 0
  };
}

export function getSpriteAnimationPlaybackFrameIndex(
  clip: SpriteAnimationClip,
  elapsedSeconds: number,
  options: SpriteAnimationTimingOptions = {}
): number {
  assertNonNegativeFinite(elapsedSeconds, "elapsedSeconds");
  const timing = resolveSpriteAnimationTiming(clip, options);

  return resolveSpriteAnimationPlaybackAt(clip, timing, elapsedSeconds).frameIndex;
}

export function getSpriteAnimationPlaybackFrameId(
  clip: SpriteAnimationClip,
  state: SpriteAnimationPlaybackState
): string {
  assertStateMatchesClip(state, clip);

  if (state.frameIndex < 0 || state.frameIndex >= clip.frameIds.length) {
    throw new Error(`Sprite animation playback for clip "${clip.id}" has invalid frameIndex ${state.frameIndex}.`);
  }

  return clip.frameIds[state.frameIndex];
}

export class AnimationStateMachine {
  private current = "idle";

  setState(state: string): void {
    this.current = state;
  }

  getState(): string {
    return this.current;
  }
}

type SpriteAnimationResolvedTiming = {
  frameDurations: number[];
  totalDuration: number;
};

type SpriteAnimationPlaybackResolution = {
  elapsedSeconds: number;
  frameIndex: number;
  completedLoops: number;
  completed: boolean;
};

function resolveSpriteAnimationTiming(
  clip: SpriteAnimationClip,
  options: SpriteAnimationTimingOptions
): SpriteAnimationResolvedTiming {
  if (clip.frameIds.length === 0) {
    throw new Error(`Sprite animation clip "${clip.id}" must include at least one frame id.`);
  }

  const clipFrameDuration = clip.frameDurationSeconds;
  if (clipFrameDuration !== undefined) {
    assertPositiveFinite(clipFrameDuration, `Sprite animation clip "${clip.id}" frameDurationSeconds`);
  }

  const framesById = options.frames ? new Map(options.frames.map((frame) => [frame.id, frame])) : undefined;
  const frameDurations = clip.frameIds.map((frameId) => {
    const frame = framesById?.get(frameId);

    if (framesById && !frame) {
      throw new Error(`Sprite animation clip "${clip.id}" references missing frame "${frameId}" in playback frames.`);
    }

    if (frame?.durationSeconds !== undefined) {
      assertPositiveFinite(frame.durationSeconds, `Sprite frame "${frame.id}" durationSeconds`);
      return frame.durationSeconds;
    }

    if (clipFrameDuration !== undefined) {
      return clipFrameDuration;
    }

    throw new Error(
      `Sprite animation clip "${clip.id}" needs frameDurationSeconds or frame "${frameId}" durationSeconds.`
    );
  });

  return {
    frameDurations,
    totalDuration: frameDurations.reduce((sum, duration) => sum + duration, 0)
  };
}

function resolveSpriteAnimationPlaybackAt(
  clip: SpriteAnimationClip,
  timing: SpriteAnimationResolvedTiming,
  elapsedSeconds: number
): SpriteAnimationPlaybackResolution {
  const loop = clip.loop ?? true;
  const completed = !loop && elapsedSeconds >= timing.totalDuration;
  const resolvedElapsedSeconds = completed ? timing.totalDuration : elapsedSeconds;
  const completedLoops = loop
    ? Math.floor(elapsedSeconds / timing.totalDuration)
    : completed
      ? 1
      : 0;
  const localElapsedSeconds = loop ? elapsedSeconds % timing.totalDuration : resolvedElapsedSeconds;

  return {
    elapsedSeconds: resolvedElapsedSeconds,
    frameIndex: completed
      ? clip.frameIds.length - 1
      : resolveFrameIndexFromElapsed(timing.frameDurations, localElapsedSeconds),
    completedLoops,
    completed
  };
}

function resolveFrameIndexFromElapsed(frameDurations: readonly number[], elapsedSeconds: number): number {
  let cursor = 0;

  for (let index = 0; index < frameDurations.length; index += 1) {
    cursor += frameDurations[index];

    if (elapsedSeconds < cursor || index === frameDurations.length - 1) {
      return index;
    }
  }

  return frameDurations.length - 1;
}

function assertStateMatchesClip(state: SpriteAnimationPlaybackState, clip: SpriteAnimationClip): void {
  if (state.clipId !== clip.id) {
    throw new Error(`Sprite animation playback for clip "${state.clipId}" cannot be used with clip "${clip.id}".`);
  }
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than 0.`);
  }
}

function assertNonNegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be greater than or equal to 0.`);
  }
}
