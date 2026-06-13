import { World } from "./world.js";
import { System } from "./system.js";

export abstract class Scene {
  public readonly world = new World(this);
  public readonly systems: System[] = [];
  public started = false;
  public destroyed = false;
  private nextSystemOrder = 0;

  constructor(public readonly name: string) {}

  addSystem<T extends System>(system: T): T {
    if (this.destroyed) {
      throw new Error(`Cannot add system to destroyed scene "${this.name}".`);
    }

    if (system.scene !== this) {
      throw new Error(`Cannot add system from a different scene to "${this.name}".`);
    }

    if (this.systems.includes(system)) {
      return system;
    }

    system.register(this.nextSystemOrder);
    this.nextSystemOrder += 1;
    this.systems.push(system);
    this.sortSystems();
    if (this.started) system.initialize();
    return system;
  }

  getSystem<T extends System>(type: new (...args: never[]) => T): T | undefined {
    return this.systems.find((system) => system instanceof type) as T | undefined;
  }

  start(): void {
    if (this.destroyed) {
      throw new Error(`Cannot start destroyed scene "${this.name}".`);
    }

    if (this.started) return;

    this.onStart();
    this.started = true;
    for (const system of this.systems) system.initialize();
  }

  protected onStart(): void {}

  update(dt: number): void {
    if (!this.started || this.destroyed) return;

    this.world.beginPhase();
    for (const system of this.systems) {
      if (system.enabled) system.update(dt);
    }
    this.world.update(dt);
    this.world.endPhase();
  }

  fixedUpdate(dt: number): void {
    if (!this.started || this.destroyed) return;

    this.world.beginPhase();
    for (const system of this.systems) {
      if (system.enabled) system.fixedUpdate(dt);
    }
    this.world.fixedUpdate(dt);
    this.world.endPhase();
  }

  lateUpdate(dt: number): void {
    if (!this.started || this.destroyed) return;

    this.world.beginPhase();
    this.world.lateUpdate(dt);
    for (const system of this.systems) {
      if (system.enabled) system.lateUpdate(dt);
    }
    this.world.endPhase();
  }

  destroy(): void {
    if (this.destroyed) return;

    this.destroyed = true;
    this.started = false;
    this.nextSystemOrder = 0;

    for (const system of this.systems) system.dispose();
    this.systems.length = 0;
    this.world.destroy();
  }

  private sortSystems(): void {
    this.systems.sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      return left.order - right.order;
    });
  }
}
