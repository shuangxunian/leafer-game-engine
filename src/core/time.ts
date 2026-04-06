export class Time {
  public delta = 0;
  public elapsed = 0;
  public scale = 1;
  public paused = false;

  constructor(public readonly fixedDelta = 1 / 60) {}

  step(rawDeltaSeconds: number): number {
    if (this.paused) {
      this.delta = 0;
      return 0;
    }

    this.delta = rawDeltaSeconds * this.scale;
    this.elapsed += this.delta;
    return this.delta;
  }
}
