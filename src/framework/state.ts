export type StateTransition<TState extends string> = {
  from: TState;
  to: TState;
};

export type StateChangeHooks<TState extends string> = {
  onEnter?: (transition: StateTransition<TState>) => void;
  onExit?: (transition: StateTransition<TState>) => void;
};

export type StateMachineOptions<TState extends string> = {
  states?: Partial<Record<TState, StateChangeHooks<TState>>>;
  onTransition?: (transition: StateTransition<TState>) => void;
};

export class StateMachine<TState extends string> {
  private readonly states: Partial<Record<TState, StateChangeHooks<TState>>>;
  private readonly onTransition?: (transition: StateTransition<TState>) => void;

  constructor(
    private currentState: TState,
    options: StateMachineOptions<TState> = {}
  ) {
    this.states = options.states ?? {};
    this.onTransition = options.onTransition;
  }

  getState(): TState {
    return this.currentState;
  }

  is(state: TState): boolean {
    return this.currentState === state;
  }

  matches(...states: TState[]): boolean {
    return states.includes(this.currentState);
  }

  transition(to: TState): boolean {
    if (to === this.currentState) return false;

    const transition = { from: this.currentState, to };
    this.states[this.currentState]?.onExit?.(transition);
    this.currentState = to;
    this.states[this.currentState]?.onEnter?.(transition);
    this.onTransition?.(transition);
    return true;
  }
}
