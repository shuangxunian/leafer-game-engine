import type { RenderSpriteAsset } from "../adapter/index.js";
import { Component, System } from "../core/index.js";
import type { AssetRegistry } from "./assets.js";
import { ViewComponent } from "./view.js";

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

export type SpriteAnimationComponentOptions = {
  startPaused?: boolean;
};

export type SpriteAnimationSystemOptions = {
  applyToView?: boolean;
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

export class SpriteAnimationComponent extends Component {
  public playback: SpriteAnimationPlaybackState;
  public currentFrameId?: string;
  public currentSpriteId?: string;

  constructor(
    public clipId = "",
    options: SpriteAnimationComponentOptions = {}
  ) {
    super();
    this.playback = createInitialSpriteAnimationPlayback(clipId, options.startPaused ? "paused" : "playing");
  }

  play(clipId = this.clipId): void {
    this.clipId = clipId;
    this.playback = createInitialSpriteAnimationPlayback(clipId, "playing");
    this.currentFrameId = undefined;
    this.currentSpriteId = undefined;
  }

  pause(): void {
    this.playback = pauseSpriteAnimationPlayback(this.playback);
  }

  resume(): void {
    this.playback = resumeSpriteAnimationPlayback(this.playback);
  }

  stop(): void {
    this.playback = stopSpriteAnimationPlayback(this.playback);
    this.currentFrameId = undefined;
    this.currentSpriteId = undefined;
  }

  protected override validateSetup(): void {
    if (!this.clipId.trim()) {
      throw new Error("SpriteAnimationComponent clipId must be a non-empty string.");
    }
  }
}

export class SpriteAnimationSystem extends System {
  override priority = 20;
  private readonly applyToView: boolean;

  constructor(
    scene: System["scene"],
    private readonly assets: AssetRegistry,
    options: SpriteAnimationSystemOptions = {}
  ) {
    super(scene);
    this.applyToView = options.applyToView ?? true;
  }

  override update(dt: number): void {
    for (const component of this.getAnimationComponents()) {
      this.advanceComponent(component, dt);
    }
  }

  override lateUpdate(): void {
    if (!this.applyToView) return;

    for (const component of this.getAnimationComponents()) {
      this.ensureCurrentFrame(component);
      this.applyCurrentFrame(component);
    }
  }

  private getAnimationComponents(): SpriteAnimationComponent[] {
    return this.scene.world
      .getEntitiesWith(SpriteAnimationComponent)
      .map((entity) => entity.getComponent(SpriteAnimationComponent))
      .filter((component): component is SpriteAnimationComponent => Boolean(component?.enabled));
  }

  private advanceComponent(component: SpriteAnimationComponent, dt: number): void {
    const clip = this.assets.requireAnimationClip(component.clipId);
    const frames = clip.frameIds.map((frameId) => this.assets.requireSpriteFrame(frameId));

    if (component.playback.clipId !== clip.id) {
      component.playback = createInitialSpriteAnimationPlayback(clip.id, "playing");
    }

    component.playback = advanceSpriteAnimationPlayback(component.playback, clip, dt, { frames });
    this.updateCurrentFrame(component, clip, frames);
  }

  private ensureCurrentFrame(component: SpriteAnimationComponent): void {
    if (component.currentFrameId && component.currentSpriteId) return;

    const clip = this.assets.requireAnimationClip(component.clipId);
    const frames = clip.frameIds.map((frameId) => this.assets.requireSpriteFrame(frameId));
    this.updateCurrentFrame(component, clip, frames);
  }

  private updateCurrentFrame(
    component: SpriteAnimationComponent,
    clip: SpriteAnimationClip,
    frames: readonly SpriteFrame[]
  ): void {
    const currentFrameId = getSpriteAnimationPlaybackFrameId(clip, component.playback);
    const frame = frames.find((entry) => entry.id === currentFrameId);
    if (!frame) {
      throw new Error(`Sprite animation clip "${clip.id}" references missing frame "${currentFrameId}".`);
    }

    component.currentFrameId = frame.id;
    component.currentSpriteId = frame.spriteId;
  }

  private applyCurrentFrame(component: SpriteAnimationComponent): void {
    const entity = component.entity;
    if (!entity || !component.currentFrameId) return;

    const view = entity.getComponent(ViewComponent);
    if (!view) return;

    const node = view.node;
    if (!isRenderSpriteNode(node)) {
      throw new Error(
        `Cannot apply SpriteAnimationComponent on entity "${entity.name}" because its ViewComponent node does not support sprite assets.`
      );
    }

    const frame = this.assets.requireSpriteFrame(component.currentFrameId);
    const sprite = this.assets.requireSprite(frame.spriteId);
    node.setAsset(sprite);

    if (frame.width !== undefined) node.width = frame.width;
    if (frame.height !== undefined) node.height = frame.height;
  }
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

type RenderSpriteLikeNode = {
  width?: number;
  height?: number;
  setAsset(asset: string | RenderSpriteAsset): void;
};

function createInitialSpriteAnimationPlayback(
  clipId: string,
  status: SpriteAnimationPlaybackStatus
): SpriteAnimationPlaybackState {
  return {
    clipId,
    status,
    elapsedSeconds: 0,
    frameIndex: 0,
    completedLoops: 0
  };
}

function isRenderSpriteNode(node: unknown): node is RenderSpriteLikeNode {
  return Boolean(node && typeof (node as RenderSpriteLikeNode).setAsset === "function");
}

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
