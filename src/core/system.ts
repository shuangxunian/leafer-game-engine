import type { Scene } from "./scene.js";
import type { Destroyable, Updatable } from "./types.js";

export abstract class System implements Updatable, Destroyable {
  public enabled = true;

  constructor(public readonly scene: Scene) {}

  start(): void {}

  update(_dt: number): void {}

  fixedUpdate(_dt: number): void {}

  lateUpdate(_dt: number): void {}

  destroy(): void {}
}
