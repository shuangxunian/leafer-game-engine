import { World } from "./world.js";
import { System } from "./system.js";

export abstract class Scene {
  public readonly world = new World(this);
  public readonly systems: System[] = [];
  public started = false;

  constructor(public readonly name: string) {}

  addSystem<T extends System>(system: T): T {
    this.systems.push(system);
    if (this.started) system.start();
    return system;
  }

  getSystem<T extends System>(type: new (...args: never[]) => T): T | undefined {
    return this.systems.find((system) => system instanceof type) as T | undefined;
  }

  start(): void {
    this.started = true;
    this.onStart();
    for (const system of this.systems) system.start();
  }

  protected onStart(): void {}

  update(dt: number): void {
    for (const system of this.systems) {
      if (system.enabled) system.update(dt);
    }
    this.world.update(dt);
  }

  fixedUpdate(dt: number): void {
    for (const system of this.systems) {
      if (system.enabled) system.fixedUpdate(dt);
    }
    this.world.fixedUpdate(dt);
  }

  lateUpdate(dt: number): void {
    this.world.lateUpdate(dt);
    for (const system of this.systems) {
      if (system.enabled) system.lateUpdate(dt);
    }
  }

  destroy(): void {
    for (const system of this.systems) system.destroy();
    this.systems.length = 0;
    this.world.destroy();
  }
}
