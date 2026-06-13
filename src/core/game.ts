import { Time } from "./time.js";
import type { Scene } from "./scene.js";

export class Game {
  public readonly time: Time;
  public activeScene?: Scene;
  private accumulator = 0;

  constructor(fixedDelta = 1 / 60) {
    this.time = new Time(fixedDelta);
  }

  setScene(scene: Scene): void {
    if (this.activeScene === scene) {
      if (!scene.started) scene.start();
      return;
    }

    this.activeScene?.destroy();
    this.activeScene = scene;
    this.accumulator = 0;
    scene.start();
  }

  tick(rawDeltaSeconds: number): void {
    const dt = this.time.step(rawDeltaSeconds);
    if (!this.activeScene || dt <= 0) return;

    this.accumulator += dt;
    this.activeScene.update(dt);

    while (this.accumulator >= this.time.fixedDelta) {
      this.activeScene.fixedUpdate(this.time.fixedDelta);
      this.accumulator -= this.time.fixedDelta;
    }

    this.activeScene.lateUpdate(dt);
  }
}
