import type { Entity } from "./entity.js";
import type { Scene } from "./scene.js";
import type { Destroyable, Updatable } from "./types.js";

export abstract class Component implements Updatable, Destroyable {
  public entity?: Entity;
  public enabled = true;
  public started = false;
  public destroyed = false;

  attach(entity: Entity): void {
    this.entity = entity;
    this.onAttach(entity.scene);
  }

  detach(): void {
    this.onDetach(this.entity?.scene);
    this.entity = undefined;
  }

  get scene(): Scene | undefined {
    return this.entity?.scene;
  }

  onAttach(_scene: Scene): void {}

  onDetach(_scene?: Scene): void {}

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
    this.detach();
  }

  start(): void {}

  update(_dt: number): void {}

  fixedUpdate(_dt: number): void {}

  lateUpdate(_dt: number): void {}

  destroy(): void {}
}
