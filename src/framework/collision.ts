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

export type CollisionPairEntrySnapshot = Readonly<{
  entity: Entity;
  entityId: number;
  entityName: string;
  layer: CollisionLayer;
  rect: Rect;
}>;

export type CollisionPairSnapshot = Readonly<{
  a: CollisionPairEntrySnapshot;
  b: CollisionPairEntrySnapshot;
}>;

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

  protected override getRequiredComponents() {
    return [TransformComponent];
  }

  protected override validateSetup(): void {
    const size = this.entity?.getComponent(SizeComponent);
    const hasDimensions = this.width !== undefined && this.height !== undefined;
    if (hasDimensions || size) return;

    const entityName = this.entity?.name ?? "UnknownEntity";
    throw new Error(
      `Cannot initialize ColliderComponent on entity "${entityName}" without explicit width/height or SizeComponent.`
    );
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
  override priority = 100;
  private readonly collisions = new Map<Entity, Set<Entity>>();
  private readonly entered = new Map<Entity, Set<Entity>>();
  private readonly stayed = new Map<Entity, Set<Entity>>();
  private readonly exited = new Map<Entity, Set<Entity>>();
  private currentPairs: CollisionPairSnapshot[] = [];
  private enteredPairs: CollisionPairSnapshot[] = [];
  private stayedPairs: CollisionPairSnapshot[] = [];
  private exitedPairs: CollisionPairSnapshot[] = [];

  override lateUpdate(): void {
    const previous = cloneCollisionMap(this.collisions);
    const previousPairs = this.currentPairs;
    const next = new Map<Entity, Set<Entity>>();
    const nextPairs: CollisionPairSnapshot[] = [];

    const colliders = this.scene.world
      .getEntitiesWith(ColliderComponent)
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

        link(next, current.entity, other.entity);
        link(next, other.entity, current.entity);
        nextPairs.push(createCollisionPairSnapshot(current, currentRect, other, otherRect));
      }
    }

    this.collisions.clear();
    this.entered.clear();
    this.stayed.clear();
    this.exited.clear();

    copyCollisionMap(next, this.collisions);
    diffCollisionMaps(previous, next, this.entered, this.stayed, this.exited);
    this.currentPairs = nextPairs;
    this.enteredPairs = filterPairsByMap(nextPairs, this.entered);
    this.stayedPairs = filterPairsByMap(nextPairs, this.stayed);
    this.exitedPairs = filterPairsByMap(previousPairs, this.exited);
  }

  hasCollision(entity: Entity, layer?: CollisionLayer): boolean {
    return this.hasCollisionInMap(this.collisions, entity, layer);
  }

  getCollisions(entity: Entity, layer?: CollisionLayer): Entity[] {
    return this.getCollisionsFromMap(this.collisions, entity, layer);
  }

  hasCollisionEnter(entity: Entity, layer?: CollisionLayer): boolean {
    return this.hasCollisionInMap(this.entered, entity, layer);
  }

  getCollisionEnter(entity: Entity, layer?: CollisionLayer): Entity[] {
    return this.getCollisionsFromMap(this.entered, entity, layer);
  }

  hasCollisionStay(entity: Entity, layer?: CollisionLayer): boolean {
    return this.hasCollisionInMap(this.stayed, entity, layer);
  }

  getCollisionStay(entity: Entity, layer?: CollisionLayer): Entity[] {
    return this.getCollisionsFromMap(this.stayed, entity, layer);
  }

  hasCollisionExit(entity: Entity, layer?: CollisionLayer): boolean {
    return this.hasCollisionInMap(this.exited, entity, layer);
  }

  getCollisionExit(entity: Entity, layer?: CollisionLayer): Entity[] {
    return this.getCollisionsFromMap(this.exited, entity, layer);
  }

  getCollisionPairs(layer?: CollisionLayer): CollisionPairSnapshot[] {
    return copyCollisionPairs(this.currentPairs, layer);
  }

  getCollisionEnterPairs(layer?: CollisionLayer): CollisionPairSnapshot[] {
    return copyCollisionPairs(this.enteredPairs, layer);
  }

  getCollisionStayPairs(layer?: CollisionLayer): CollisionPairSnapshot[] {
    return copyCollisionPairs(this.stayedPairs, layer);
  }

  getCollisionExitPairs(layer?: CollisionLayer): CollisionPairSnapshot[] {
    return copyCollisionPairs(this.exitedPairs, layer);
  }

  private hasCollisionInMap(
    source: Map<Entity, Set<Entity>>,
    entity: Entity,
    layer?: CollisionLayer
  ): boolean {
    return this.getCollisionsFromMap(source, entity, layer).length > 0;
  }

  private getCollisionsFromMap(
    source: Map<Entity, Set<Entity>>,
    entity: Entity,
    layer?: CollisionLayer
  ): Entity[] {
    const collisions = source.get(entity);
    if (!collisions?.size) return [];
    if (!layer) return [...collisions];

    return [...collisions].filter((other) => other.getComponent(ColliderComponent)?.layer === layer);
  }
}

function cloneCollisionMap(source: Map<Entity, Set<Entity>>): Map<Entity, Set<Entity>> {
  const cloned = new Map<Entity, Set<Entity>>();
  copyCollisionMap(source, cloned);
  return cloned;
}

function copyCollisionMap(source: Map<Entity, Set<Entity>>, target: Map<Entity, Set<Entity>>): void {
  for (const [entity, collisions] of source) {
    target.set(entity, new Set(collisions));
  }
}

function diffCollisionMaps(
  previous: Map<Entity, Set<Entity>>,
  next: Map<Entity, Set<Entity>>,
  entered: Map<Entity, Set<Entity>>,
  stayed: Map<Entity, Set<Entity>>,
  exited: Map<Entity, Set<Entity>>
): void {
  const entities = new Set<Entity>([...previous.keys(), ...next.keys()]);

  for (const entity of entities) {
    const previousSet = previous.get(entity) ?? new Set<Entity>();
    const nextSet = next.get(entity) ?? new Set<Entity>();

    for (const other of nextSet) {
      if (previousSet.has(other)) {
        link(stayed, entity, other);
      } else {
        link(entered, entity, other);
      }
    }

    for (const other of previousSet) {
      if (!nextSet.has(other)) {
        link(exited, entity, other);
      }
    }
  }
}

function link(target: Map<Entity, Set<Entity>>, from: Entity, to: Entity): void {
  const existing = target.get(from);
  if (existing) {
    existing.add(to);
    return;
  }

  target.set(from, new Set([to]));
}

function createCollisionPairSnapshot(
  a: { entity: Entity; collider: ColliderComponent },
  aRect: Rect,
  b: { entity: Entity; collider: ColliderComponent },
  bRect: Rect
): CollisionPairSnapshot {
  return {
    a: createCollisionPairEntrySnapshot(a.entity, a.collider, aRect),
    b: createCollisionPairEntrySnapshot(b.entity, b.collider, bRect)
  };
}

function createCollisionPairEntrySnapshot(
  entity: Entity,
  collider: ColliderComponent,
  rect: Rect
): CollisionPairEntrySnapshot {
  return {
    entity,
    entityId: entity.id,
    entityName: entity.name,
    layer: collider.layer,
    rect: copyRect(rect)
  };
}

function filterPairsByMap(
  pairs: readonly CollisionPairSnapshot[],
  source: Map<Entity, Set<Entity>>
): CollisionPairSnapshot[] {
  return pairs.filter((pair) => source.get(pair.a.entity)?.has(pair.b.entity) === true);
}

function copyCollisionPairs(
  pairs: readonly CollisionPairSnapshot[],
  layer?: CollisionLayer
): CollisionPairSnapshot[] {
  const filtered = layer ? pairs.filter((pair) => pair.a.layer === layer || pair.b.layer === layer) : pairs;
  return filtered.map(copyCollisionPair);
}

function copyCollisionPair(pair: CollisionPairSnapshot): CollisionPairSnapshot {
  return {
    a: copyCollisionPairEntry(pair.a),
    b: copyCollisionPairEntry(pair.b)
  };
}

function copyCollisionPairEntry(entry: CollisionPairEntrySnapshot): CollisionPairEntrySnapshot {
  return {
    ...entry,
    rect: copyRect(entry.rect)
  };
}

function copyRect(rect: Rect): Rect {
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height
  };
}
