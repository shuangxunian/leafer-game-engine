export type GameFlowPhase = "boot" | "ready" | "running" | "paused" | "ended";

export type GameFlowTransitionReason = "ready" | "start" | "pause" | "resume" | "end" | "reset";

export type GameFlowTransition = {
  from: GameFlowPhase;
  to: GameFlowPhase;
  reason: GameFlowTransitionReason;
};

export type GameFlowTransitionResult =
  | (GameFlowTransition & {
      ok: true;
      changed: boolean;
    })
  | (GameFlowTransition & {
      ok: false;
      changed: false;
      error: string;
    });

export type GameFlowOptions = {
  initialPhase?: GameFlowPhase;
  onTransition?: (transition: GameFlowTransition) => void;
};

export class GameFlow {
  private phase: GameFlowPhase;
  private readonly onTransition?: (transition: GameFlowTransition) => void;

  constructor(options: GameFlowOptions = {}) {
    this.phase = options.initialPhase ?? "boot";
    this.onTransition = options.onTransition;
  }

  getPhase(): GameFlowPhase {
    return this.phase;
  }

  is(phase: GameFlowPhase): boolean {
    return this.phase === phase;
  }

  matches(...phases: GameFlowPhase[]): boolean {
    return phases.includes(this.phase);
  }

  canUpdateGameplay(): boolean {
    return this.phase === "running";
  }

  markReady(): GameFlowTransitionResult {
    return this.transition("ready", "ready", ["boot", "ready"]);
  }

  start(): GameFlowTransitionResult {
    return this.transition("running", "start", ["ready", "running", "ended"]);
  }

  pause(): GameFlowTransitionResult {
    return this.transition("paused", "pause", ["running", "paused"]);
  }

  resume(): GameFlowTransitionResult {
    return this.transition("running", "resume", ["paused", "running"]);
  }

  end(): GameFlowTransitionResult {
    return this.transition("ended", "end", ["running", "paused", "ended"]);
  }

  reset(): GameFlowTransitionResult {
    return this.transition("ready", "reset", ["boot", "ready", "running", "paused", "ended"]);
  }

  private transition(
    to: GameFlowPhase,
    reason: GameFlowTransitionReason,
    allowedFrom: GameFlowPhase[]
  ): GameFlowTransitionResult {
    const from = this.phase;

    if (!allowedFrom.includes(from)) {
      return {
        ok: false,
        changed: false,
        from,
        to,
        reason,
        error: `Cannot ${reason} game flow from "${from}" to "${to}".`
      };
    }

    if (from === to) {
      return {
        ok: true,
        changed: false,
        from,
        to,
        reason
      };
    }

    this.phase = to;
    const transition = { from, to, reason };
    this.onTransition?.(transition);

    return {
      ok: true,
      changed: true,
      ...transition
    };
  }
}
