import type { Entity } from "../core/index.js";
import { ColliderComponent, type CollisionLayer, type Rect } from "./collision.js";
import { SizeComponent } from "./size.js";
import { TransformComponent } from "./transform.js";

export type HitTestPoint = Readonly<{
  x: number;
  y: number;
}>;

export type EntityHitRectSource = "size" | "collider";

export type EntityHitTestOptions = Readonly<{
  includeInactive?: boolean;
  layer?: CollisionLayer;
  rectSource?: EntityHitRectSource;
  filter?: (entity: Entity) => boolean;
}>;

export type EntityHitTestResult = Readonly<{
  entity: Entity;
  entityId: number;
  entityName: string;
  rect: Rect;
}>;

export function pointInRect(point: HitTestPoint, rect: Rect): boolean {
  const x = readFiniteNumber(point.x, "Hit test point x");
  const y = readFiniteNumber(point.y, "Hit test point y");
  const rectX = readFiniteNumber(rect.x, "Hit test rect x");
  const rectY = readFiniteNumber(rect.y, "Hit test rect y");
  const width = readNonNegativeFiniteNumber(rect.width, "Hit test rect width");
  const height = readNonNegativeFiniteNumber(rect.height, "Hit test rect height");

  return x >= rectX && x <= rectX + width && y >= rectY && y <= rectY + height;
}

export function getEntityHitRect(
  entity: Entity,
  options: Pick<EntityHitTestOptions, "layer" | "rectSource"> = {}
): Rect | undefined {
  const rectSource = options.rectSource ?? "size";
  if (rectSource === "collider") {
    return getColliderHitRect(entity, options.layer);
  }

  return getSizeHitRect(entity);
}

export function hitTestEntitiesAtPoint(
  point: HitTestPoint,
  entities: readonly Entity[],
  options: EntityHitTestOptions = {}
): EntityHitTestResult[] {
  const results: EntityHitTestResult[] = [];

  for (const entity of entities) {
    if (!options.includeInactive && (!entity.active || entity.destroyed)) continue;
    if (options.filter && !options.filter(entity)) continue;

    const rect = getEntityHitRect(entity, options);
    if (!rect || !pointInRect(point, rect)) continue;

    results.push({
      entity,
      entityId: entity.id,
      entityName: entity.name,
      rect: copyRect(rect)
    });
  }

  return results;
}

export function pickTopEntityAtPoint(
  point: HitTestPoint,
  entities: readonly Entity[],
  options: EntityHitTestOptions = {}
): EntityHitTestResult | undefined {
  for (let index = entities.length - 1; index >= 0; index -= 1) {
    const [hit] = hitTestEntitiesAtPoint(point, [entities[index]], options);
    if (hit) return hit;
  }

  return undefined;
}

function getSizeHitRect(entity: Entity): Rect | undefined {
  const transform = entity.getComponent(TransformComponent);
  const size = entity.getComponent(SizeComponent);
  if (!transform || !size) return undefined;

  return {
    x: transform.x,
    y: transform.y,
    width: size.width,
    height: size.height
  };
}

function getColliderHitRect(entity: Entity, layer?: CollisionLayer): Rect | undefined {
  const collider = entity.getComponent(ColliderComponent);
  if (!collider) return undefined;
  if (layer !== undefined && collider.layer !== layer) return undefined;

  return collider.getRect();
}

function copyRect(rect: Rect): Rect {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height
  };
}

function readFiniteNumber(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }

  return value;
}

function readNonNegativeFiniteNumber(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite number greater than or equal to 0.`);
  }

  return value;
}
