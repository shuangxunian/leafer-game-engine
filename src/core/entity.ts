import { Component } from "./component.js";
import type { Scene } from "./scene.js";

let nextEntityId = 1;

export class Entity {
  public readonly id = nextEntityId++;
  public readonly components: Component[] = [];
  public active = true;

  constructor(public readonly scene: Scene, public name = `Entity-${nextEntityId}`) {}

  addComponent<T extends Component>(component: T): T {
    this.components.push(component);
    component.attach(this);
    component.start();
    return component;
  }

  getComponent<T extends Component>(type: new (...args: never[]) => T): T | undefined {
    return this.components.find((component) => component instanceof type) as T | undefined;
  }

  update(dt: number): void {
    if (!this.active) return;
    for (const component of this.components) {
      if (component.enabled) component.update(dt);
    }
  }

  fixedUpdate(dt: number): void {
    if (!this.active) return;
    for (const component of this.components) {
      if (component.enabled) component.fixedUpdate(dt);
    }
  }

  lateUpdate(dt: number): void {
    if (!this.active) return;
    for (const component of this.components) {
      if (component.enabled) component.lateUpdate(dt);
    }
  }

  destroy(): void {
    for (const component of this.components) {
      component.destroy();
      component.detach();
    }
    this.components.length = 0;
    this.active = false;
  }
}
