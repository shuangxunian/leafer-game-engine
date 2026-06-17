import { Component, type ComponentType } from "./component.js";
import { Entity } from "./entity.js";
import type { Scene } from "./scene.js";

export class World {
  public readonly entities: Entity[] = [];
  private readonly pendingAdditions: Entity[] = [];
  private readonly pendingRemovals = new Set<Entity>();
  private phaseDepth = 0;
  private destroyed = false;

  constructor(public readonly scene: Scene) {}

  createEntity(name?: string): Entity {
    if (this.destroyed) {
      throw new Error(`Cannot create entity in destroyed scene "${this.scene.name}".`);
    }

    const entity = new Entity(this.scene, name);

    if (this.phaseDepth > 0) {
      this.pendingAdditions.push(entity);
    } else {
      this.entities.push(entity);
    }

    return entity;
  }

  destroyEntity(entity: Entity): void {
    if (this.destroyed || entity.destroyed) return;

    if (this.phaseDepth > 0) {
      entity.deactivate();
      this.pendingRemovals.add(entity);
      return;
    }

    this.removeEntityImmediately(entity);
  }

  beginPhase(): void {
    if (this.destroyed) return;

    if (this.phaseDepth === 0) {
      this.flushPending();
    }

    this.phaseDepth += 1;
  }

  endPhase(): void {
    if (this.phaseDepth === 0) return;

    this.phaseDepth -= 1;

    if (this.phaseDepth === 0) {
      this.flushPending();
    }
  }

  update(dt: number): void {
    this.beginPhase();
    try {
      for (const entity of this.entities) entity.update(dt);
    } finally {
      this.endPhase();
    }
  }

  fixedUpdate(dt: number): void {
    this.beginPhase();
    try {
      for (const entity of this.entities) entity.fixedUpdate(dt);
    } finally {
      this.endPhase();
    }
  }

  lateUpdate(dt: number): void {
    this.beginPhase();
    try {
      for (const entity of this.entities) entity.lateUpdate(dt);
    } finally {
      this.endPhase();
    }
  }

  destroy(): void {
    if (this.destroyed) return;

    this.destroyed = true;

    const allEntities = new Set<Entity>([
      ...this.entities,
      ...this.pendingAdditions,
      ...this.pendingRemovals
    ]);

    this.entities.length = 0;
    this.pendingAdditions.length = 0;
    this.pendingRemovals.clear();
    this.phaseDepth = 0;

    for (const entity of allEntities) {
      entity.destroy();
    }
  }

  getEntities(): Entity[] {
    return this.getLiveEntities();
  }

  getEntitiesWith<T extends Component>(type: ComponentType<T>): Entity[] {
    return this.getLiveEntities().filter((entity) => Boolean(entity.getComponent(type)));
  }

  getEntitiesWithAll(...types: ComponentType[]): Entity[] {
    if (types.length === 0) return this.getLiveEntities();

    return this.getLiveEntities().filter((entity) => types.every((type) => Boolean(entity.getComponent(type))));
  }

  getEntitiesWithAny(...types: ComponentType[]): Entity[] {
    if (types.length === 0) return [];

    return this.getLiveEntities().filter((entity) => types.some((type) => Boolean(entity.getComponent(type))));
  }

  private flushPending(): void {
    if (this.destroyed) return;

    if (this.pendingRemovals.size > 0) {
      for (const entity of this.pendingRemovals) {
        const pendingIndex = this.pendingAdditions.indexOf(entity);
        if (pendingIndex >= 0) {
          this.pendingAdditions.splice(pendingIndex, 1);
        }

        this.removeEntityImmediately(entity);
      }

      this.pendingRemovals.clear();
    }

    if (this.pendingAdditions.length > 0) {
      const additions = this.pendingAdditions.splice(0);
      for (const entity of additions) {
        if (!entity.destroyed) {
          this.entities.push(entity);
        }
      }
    }
  }

  private removeEntityImmediately(entity: Entity): void {
    const index = this.entities.indexOf(entity);
    if (index >= 0) {
      this.entities.splice(index, 1);
    }

    entity.destroy();
  }

  private getLiveEntities(): Entity[] {
    return this.entities.filter((entity) => entity.active && !entity.destroyed);
  }
}
