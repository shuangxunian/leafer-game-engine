import { Component } from "./component.js";
import type { Scene } from "./scene.js";

let nextEntityId = 1;

export class Entity {
  public readonly id = nextEntityId++;
  public readonly components: Component[] = [];
  public active = true;
  public destroyed = false;

  constructor(public readonly scene: Scene, public name = `Entity-${nextEntityId}`) {}

  addComponent<T extends Component>(component: T): T {
    if (this.destroyed) {
      throw new Error(`Cannot add component to destroyed entity "${this.name}".`);
    }

    if (component.entity && component.entity !== this) {
      throw new Error(`Cannot attach component to "${this.name}" because it already belongs to another entity.`);
    }

    if (this.components.includes(component)) {
      return component;
    }

    this.components.push(component);
    component.attach(this);
    component.initialize();
    return component;
  }

  getComponent<T extends Component>(type: new (...args: never[]) => T): T | undefined {
    return this.components.find((component) => component instanceof type) as T | undefined;
  }

  update(dt: number): void {
    if (!this.active) return;
    for (const component of this.components) {
      if (!this.active) break;
      if (component.enabled) component.update(dt);
    }
  }

  fixedUpdate(dt: number): void {
    if (!this.active) return;
    for (const component of this.components) {
      if (!this.active) break;
      if (component.enabled) component.fixedUpdate(dt);
    }
  }

  lateUpdate(dt: number): void {
    if (!this.active) return;
    for (const component of this.components) {
      if (!this.active) break;
      if (component.enabled) component.lateUpdate(dt);
    }
  }

  deactivate(): void {
    if (this.destroyed) return;
    this.active = false;
  }

  destroy(): void {
    if (this.destroyed) return;

    this.destroyed = true;
    this.active = false;

    for (const component of this.components) {
      component.dispose();
    }

    this.components.length = 0;
  }
}
