import { Entity } from "./entity.js";
import type { Scene } from "./scene.js";

export class World {
  public readonly entities: Entity[] = [];

  constructor(public readonly scene: Scene) {}

  createEntity(name?: string): Entity {
    const entity = new Entity(this.scene, name);
    this.entities.push(entity);
    return entity;
  }

  destroyEntity(entity: Entity): void {
    const index = this.entities.indexOf(entity);
    if (index >= 0) this.entities.splice(index, 1);
    entity.destroy();
  }

  update(dt: number): void {
    for (const entity of this.entities) entity.update(dt);
  }

  fixedUpdate(dt: number): void {
    for (const entity of this.entities) entity.fixedUpdate(dt);
  }

  lateUpdate(dt: number): void {
    for (const entity of this.entities) entity.lateUpdate(dt);
  }

  destroy(): void {
    for (const entity of [...this.entities]) this.destroyEntity(entity);
  }
}
