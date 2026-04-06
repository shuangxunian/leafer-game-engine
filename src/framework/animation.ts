export class AnimationStateMachine {
  private current = "idle";

  setState(state: string): void {
    this.current = state;
  }

  getState(): string {
    return this.current;
  }
}
