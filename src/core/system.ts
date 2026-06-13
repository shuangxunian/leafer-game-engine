import type { Scene } from "./scene.js";
import type { Destroyable, Updatable } from "./types.js";

export abstract class System implements Updatable, Destroyable {
  public enabled = true;
  public started = false;
  public destroyed = false;
  public priority = 0;
  private registrationOrder = -1;

  constructor(public readonly scene: Scene) {}

  get order(): number {
    return this.registrationOrder;
  }

  register(order: number): void {
    if (this.registrationOrder >= 0) return;
    this.registrationOrder = order;
  }

  initialize(): void {
    if (this.started || this.destroyed) return;
    this.started = true;
    this.start();
  }

  dispose(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.enabled = false;
    this.destroy();
  }

  start(): void {}

  update(_dt: number): void {}

  fixedUpdate(_dt: number): void {}

  lateUpdate(_dt: number): void {}

  destroy(): void {}
}
