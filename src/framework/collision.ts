import type { Entity } from "../core/index.js";
import { Component, System } from "../core/index.js";
import { SizeComponent } from "./size.js";
import { TransformComponent } from "./transform.js";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CollisionLayer = string;

export function intersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export class ColliderComponent extends Component {
  constructor(
    public readonly layer: CollisionLayer,
    public width?: number,
    public height?: number,
    public offsetX = 0,
    public offsetY = 0
  ) {
    super();
  }

  getRect(): Rect | undefined {
    const transform = this.entity?.getComponent(TransformComponent);
    if (!transform) return undefined;

    const size = this.entity?.getComponent(SizeComponent);
    const width = this.width ?? size?.width;
    const height = this.height ?? size?.height;
    if (width === undefined || height === undefined) return undefined;

    return {
      x: transform.x + this.offsetX,
      y: transform.y + this.offsetY,
      width,
      height
    };
  }
}

export class CollisionSystem extends System {
  private readonly collisions = new Map<Entity, Set<Entity>>();

  override lateUpdate(): void {
    this.collisions.clear();

    const colliders = this.scene.world.entities
      .map((entity) => ({ entity, collider: entity.getComponent(ColliderComponent) }))
      .filter((entry): entry is { entity: Entity; collider: ColliderComponent } => Boolean(entry.collider));

    for (let index = 0; index < colliders.length; index += 1) {
      const current = colliders[index];
      const currentRect = current.collider.getRect();
      if (!currentRect) continue;

      for (let nextIndex = index + 1; nextIndex < colliders.length; nextIndex += 1) {
        const other = colliders[nextIndex];
        const otherRect = other.collider.getRect();
        if (!otherRect) continue;

        if (!intersects(currentRect, otherRect)) continue;

        this.link(current.entity, other.entity);
        this.link(other.entity, current.entity);
      }
    }
  }

  hasCollision(entity: Entity, layer?: CollisionLayer): boolean {
    const collisions = this.collisions.get(entity);
    if (!collisions?.size) return false;
    if (!layer) return true;

    for (const other of collisions) {
      const collider = other.getComponent(ColliderComponent);
      if (collider?.layer === layer) return true;
    }

    return false;
  }

  getCollisions(entity: Entity, layer?: CollisionLayer): Entity[] {
    const collisions = this.collisions.get(entity);
    if (!collisions?.size) return [];
    if (!layer) return [...collisions];

    return [...collisions].filter((other) => other.getComponent(ColliderComponent)?.layer === layer);
  }

  private link(from: Entity, to: Entity): void {
    const existing = this.collisions.get(from);
    if (existing) {
      existing.add(to);
      return;
    }

    this.collisions.set(from, new Set([to]));
  }
}
