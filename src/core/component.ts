import type { Entity } from "./entity.js";
import type { Scene } from "./scene.js";
import type { Destroyable, Updatable } from "./types.js";

export type ComponentType<T extends Component = Component> = new (...args: never[]) => T;

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

    this.validateDependencies();
    this.validateSetup();
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

  protected getRequiredComponents(): ComponentType[] {
    return [];
  }

  protected validateSetup(): void {}

  private validateDependencies(): void {
    const entity = this.entity;
    if (!entity) {
      throw new Error(`Cannot initialize ${this.constructor.name} before it is attached to an entity.`);
    }

    const missing = this.getRequiredComponents().filter((type) => !entity.getComponent(type));
    if (!missing.length) return;

    const names = missing.map((type) => type.name).join(", ");
    throw new Error(
      `Cannot initialize ${this.constructor.name} on entity "${entity.name}" because it requires: ${names}.`
    );
  }
}
