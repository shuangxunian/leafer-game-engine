import type {
  RenderAdapter,
  RenderScene,
  RenderSceneLayerName,
  RenderSprite,
  RenderSpriteAsset
} from "../adapter/index.js";
import type { Component, Entity, Scene } from "../core/index.js";
import type { AssetRegistry } from "./assets.js";
import { ColliderComponent } from "./collision.js";
import { SizeComponent } from "./size.js";
import { TransformComponent } from "./transform.js";
import { VelocityComponent } from "./movement.js";
import { ViewComponent } from "./view.js";

export type EntityFactoryContext = {
  assets?: AssetRegistry;
  scene: Scene;
  renderAdapter: RenderAdapter;
  renderScene: RenderScene;
};

export type EntityFactory<TOptions> = {
  create(context: EntityFactoryContext, options: TOptions): Entity;
};

export function defineEntityFactory<TOptions>(
  create: (context: EntityFactoryContext, options: TOptions) => Entity
): EntityFactory<TOptions> {
  return {
    create(context, options) {
      return create(context, options);
    }
  };
}

export type EntityTemplate = {
  name?: string;
  components?: EntityTemplateComponent[];
};

export type EntityTemplateComponent<TData = unknown> = {
  type: string;
  data?: TData;
};

export type ActorTemplateDefinition = {
  name?: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  collider?: ActorTemplateColliderDefinition;
  velocity?: ActorTemplateVelocityDefinition;
  components?: EntityTemplateComponent[];
};

export type ActorTemplateColliderDefinition = {
  layer?: string;
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
};

export type ActorTemplateVelocityDefinition = {
  vx?: number;
  vy?: number;
};

export type EntityTemplateFactory<TData = unknown> = (data: TData) => Component;

export type InstantiateEntityTemplateOptions = {
  registry?: EntityTemplateRegistry;
};

export type ActorSpriteViewOptions = {
  asset?: string | RenderSpriteAsset;
  layer?: RenderSceneLayerName;
  renderAdapter: RenderAdapter;
  renderScene: RenderScene;
};

export type ActorSpriteView = {
  node: RenderSprite;
  view: ViewComponent;
};

export class EntityTemplateRegistry {
  private readonly factories = new Map<string, EntityTemplateFactory>();

  register<TData>(type: string, factory: EntityTemplateFactory<TData>): this {
    const normalized = normalizeComponentType(type);
    if (!normalized) {
      throw new Error("Entity template component type must be a non-empty string.");
    }

    this.factories.set(normalized, factory as EntityTemplateFactory);
    return this;
  }

  create(component: EntityTemplateComponent): Component {
    const normalized = normalizeComponentType(component.type);
    const factory = normalized ? this.factories.get(normalized) : undefined;
    if (!factory) {
      throw new Error(`Unknown entity template component type "${component.type}".`);
    }

    return factory(component.data);
  }

  has(type: string): boolean {
    const normalized = normalizeComponentType(type);
    return Boolean(normalized && this.factories.has(normalized));
  }
}

export function createDefaultEntityTemplateRegistry(): EntityTemplateRegistry {
  return new EntityTemplateRegistry()
    .register("transform", createTransformFromTemplate)
    .register("size", createSizeFromTemplate)
    .register("collider", createColliderFromTemplate)
    .register("velocity", createVelocityFromTemplate);
}

export function instantiateEntityTemplate(
  scene: Scene,
  template: EntityTemplate,
  options: InstantiateEntityTemplateOptions = {}
): Entity {
  const registry = options.registry ?? createDefaultEntityTemplateRegistry();
  const entity = scene.world.createEntity(template.name);

  for (const component of template.components ?? []) {
    entity.addComponent(registry.create(component));
  }

  return entity;
}

export function attachActorSpriteView(
  entity: Entity,
  options: ActorSpriteViewOptions
): ActorSpriteView {
  const targetLayer = options.layer ?? "world";
  const renderLayer = options.renderScene.layers[targetLayer];
  if (!renderLayer) {
    throw new Error(`Render scene layer "${targetLayer}" was not found.`);
  }

  const node = options.renderAdapter.createSprite();
  if (options.asset !== undefined) {
    node.setAsset(options.asset);
  }

  renderLayer.addChild(node);
  const view = entity.addComponent(new ViewComponent(node));
  return { node, view };
}

export function defineActorTemplate(definition: ActorTemplateDefinition): EntityTemplate {
  const components: EntityTemplateComponent[] = [
    {
      type: "transform",
      data: {
        x: definition.x ?? 0,
        y: definition.y ?? 0,
        rotation: definition.rotation ?? 0,
        scaleX: definition.scaleX ?? 1,
        scaleY: definition.scaleY ?? 1
      }
    },
    {
      type: "size",
      data: {
        width: definition.width,
        height: definition.height
      }
    }
  ];

  if (definition.collider) {
    components.push({
      type: "collider",
      data: { ...definition.collider }
    });
  }

  if (definition.velocity) {
    components.push({
      type: "velocity",
      data: { ...definition.velocity }
    });
  }

  components.push(
    ...(definition.components ?? []).map((component) => ({
      type: component.type,
      data: copyTemplateComponentData(component.data)
    }))
  );

  return {
    name: definition.name,
    components
  };
}

type TransformTemplateData = {
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
};

type SizeTemplateData = {
  width: number;
  height: number;
};

type ColliderTemplateData = {
  layer?: string;
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
};

type VelocityTemplateData = {
  vx?: number;
  vy?: number;
};

function createTransformFromTemplate(data: unknown): TransformComponent {
  const values = readRecord(data, "transform");
  const transform = new TransformComponent();
  transform.x = readNumberWithDefault(values, "x", 0, "transform");
  transform.y = readNumberWithDefault(values, "y", 0, "transform");
  transform.rotation = readNumberWithDefault(values, "rotation", 0, "transform");
  transform.scaleX = readNumberWithDefault(values, "scaleX", 1, "transform");
  transform.scaleY = readNumberWithDefault(values, "scaleY", 1, "transform");
  return transform;
}

function createSizeFromTemplate(data: unknown): SizeComponent {
  const values = readRecord(data, "size") as SizeTemplateData;
  return new SizeComponent(
    readRequiredNumber(values, "width", "size"),
    readRequiredNumber(values, "height", "size")
  );
}

function createColliderFromTemplate(data: unknown): ColliderComponent {
  const values = readRecord(data, "collider") as ColliderTemplateData;
  const layer = values.layer ?? "default";
  if (typeof layer !== "string" || !layer.trim()) {
    throw new Error('Invalid entity template data for "collider.layer": expected non-empty string.');
  }

  return new ColliderComponent(
    layer,
    readOptionalNumber(values, "width", undefined, "collider"),
    readOptionalNumber(values, "height", undefined, "collider"),
    readOptionalNumber(values, "offsetX", 0, "collider"),
    readOptionalNumber(values, "offsetY", 0, "collider")
  );
}

function createVelocityFromTemplate(data: unknown): VelocityComponent {
  const values = readRecord(data, "velocity") as VelocityTemplateData;
  return new VelocityComponent(
    readNumberWithDefault(values, "vx", 0, "velocity"),
    readNumberWithDefault(values, "vy", 0, "velocity")
  );
}

function normalizeComponentType(type: string): string {
  return type.trim().toLowerCase();
}

function readRecord(data: unknown, componentType: string): Record<string, unknown> {
  if (data === undefined) return {};
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }

  throw new Error(`Invalid entity template data for "${componentType}": expected object.`);
}

function readRequiredNumber(values: Record<string, unknown>, key: string, componentType: string): number {
  const value = values[key];
  if (typeof value === "number") return value;

  throw new Error(`Invalid entity template data for "${componentType}.${key}": expected number.`);
}

function readOptionalNumber(
  values: Record<string, unknown>,
  key: string,
  fallback: number | undefined,
  componentType: string
): number | undefined {
  const value = values[key];
  if (value === undefined) return fallback;
  if (typeof value === "number") return value;

  throw new Error(`Invalid entity template data for "${componentType}.${key}": expected number.`);
}

function readNumberWithDefault(
  values: Record<string, unknown>,
  key: string,
  fallback: number,
  componentType: string
): number {
  return readOptionalNumber(values, key, fallback, componentType) ?? fallback;
}

function copyTemplateComponentData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(copyTemplateComponentData);
  }

  if (typeof data === "object" && data !== null) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, copyTemplateComponentData(value)])
    );
  }

  return data;
}
