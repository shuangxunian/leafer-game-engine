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

export function defineSpriteFrame(frame: SpriteFrame): SpriteFrame {
  return { ...frame };
}

export function defineSpriteAnimationClip(clip: SpriteAnimationClip): SpriteAnimationClip {
  return {
    ...clip,
    frameIds: [...clip.frameIds]
  };
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
