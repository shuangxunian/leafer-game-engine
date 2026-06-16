import type { RenderScene } from "../adapter/index.js";
import type { Component, Game, Scene } from "../core/index.js";
import type { AssetRegistry, ComponentSchema, ComponentSchemaRegistry } from "../framework/index.js";

export type DebugSnapshot = {
  sceneName: string;
  entityCount: number;
  activeEntityCount: number;
  destroyedEntityCount: number;
  systemCount: number;
  systems: DebugSystemSnapshot[];
  time?: DebugTimeSnapshot;
  render?: DebugRenderSnapshot;
  assets?: DebugAssetSnapshot;
};

export type DebugSystemSnapshot = {
  name: string;
  enabled: boolean;
  started: boolean;
  priority: number;
};

export type DebugTimeSnapshot = {
  delta: number;
  elapsed: number;
  fixedDelta: number;
  fps: number;
  paused: boolean;
  scale: number;
};

export type DebugRenderSnapshot = {
  width: number;
  height: number;
  layers: string[];
};

export type DebugAssetSnapshot = {
  spriteCount: number;
  sprites: string[];
};

export type DebugSnapshotOptions = {
  assets?: AssetRegistry;
  game?: Game;
  renderScene?: RenderScene;
};

export type ToolingSnapshotOptions = DebugSnapshotOptions & {
  inspector?: boolean;
  schemas?: ComponentSchemaRegistry;
};

export type InspectorPrimitive = string | number | boolean | null;

export type SceneInspectorSnapshot = {
  sceneName: string;
  entityCount: number;
  activeEntityCount: number;
  destroyedEntityCount: number;
  entities: InspectorEntitySnapshot[];
};

export type InspectorEntitySnapshot = {
  id: number;
  name: string;
  active: boolean;
  destroyed: boolean;
  componentCount: number;
  components: InspectorComponentSnapshot[];
};

export type InspectorComponentSnapshot = {
  name: string;
  enabled: boolean;
  started: boolean;
  destroyed: boolean;
  data: Record<string, InspectorPrimitive>;
};

export type ToolingSnapshot = {
  debug: DebugSnapshot;
  inspector?: SceneInspectorSnapshot;
  schemas?: ComponentSchemaSnapshot;
};

export type ComponentSchemaSnapshot = {
  count: number;
  schemas: ComponentSchema[];
};

const COMPONENT_LIFECYCLE_FIELDS = new Set(["entity", "enabled", "started", "destroyed"]);

export function createDebugSnapshot(scene: Scene, options: DebugSnapshotOptions = {}): DebugSnapshot {
  const activeEntities = scene.world.entities.filter((entity) => entity.active && !entity.destroyed);
  const destroyedEntities = scene.world.entities.filter((entity) => entity.destroyed);

  return {
    sceneName: scene.name,
    entityCount: scene.world.entities.length,
    activeEntityCount: activeEntities.length,
    destroyedEntityCount: destroyedEntities.length,
    systemCount: scene.systems.length,
    systems: scene.systems.map((system) => ({
      name: system.constructor.name,
      enabled: system.enabled,
      started: system.started,
      priority: system.priority
    })),
    time: options.game ? createTimeSnapshot(options.game) : undefined,
    render: options.renderScene ? createRenderSnapshot(options.renderScene) : undefined,
    assets: options.assets ? createAssetSnapshot(options.assets) : undefined
  };
}

export function createSceneInspectorSnapshot(scene: Scene): SceneInspectorSnapshot {
  const activeEntities = scene.world.entities.filter((entity) => entity.active && !entity.destroyed);
  const destroyedEntities = scene.world.entities.filter((entity) => entity.destroyed);

  return {
    sceneName: scene.name,
    entityCount: scene.world.entities.length,
    activeEntityCount: activeEntities.length,
    destroyedEntityCount: destroyedEntities.length,
    entities: scene.world.entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      active: entity.active,
      destroyed: entity.destroyed,
      componentCount: entity.components.length,
      components: entity.components.map(createComponentInspectorSnapshot)
    }))
  };
}

export function createToolingSnapshot(scene: Scene, options: ToolingSnapshotOptions = {}): ToolingSnapshot {
  return {
    debug: createDebugSnapshot(scene, options),
    inspector: options.inspector ? createSceneInspectorSnapshot(scene) : undefined,
    schemas: options.schemas ? createComponentSchemaSnapshot(options.schemas) : undefined
  };
}

export function formatDebugSnapshot(snapshot: DebugSnapshot): string[] {
  const lines = [
    `Scene ${snapshot.sceneName}`,
    `Entities ${snapshot.activeEntityCount}/${snapshot.entityCount}`,
    `Systems ${snapshot.systemCount}`
  ];

  if (snapshot.time) {
    lines.push(`FPS ${snapshot.time.fps}`, `DT ${snapshot.time.delta.toFixed(3)}s`);
  }

  if (snapshot.render) {
    lines.push(`Viewport ${snapshot.render.width}x${snapshot.render.height}`);
  }

  if (snapshot.assets) {
    lines.push(`Sprites ${snapshot.assets.spriteCount}`);
  }

  if (snapshot.systems.length > 0) {
    lines.push(`Order ${snapshot.systems.map((system) => `${system.name}:${system.priority}`).join(" > ")}`);
  }

  return lines;
}

export function formatSceneInspectorSnapshot(snapshot: SceneInspectorSnapshot): string[] {
  const lines = [
    `Inspector ${snapshot.sceneName}`,
    `Entities ${snapshot.activeEntityCount}/${snapshot.entityCount}`
  ];

  for (const entity of snapshot.entities) {
    const state = entity.destroyed ? "destroyed" : entity.active ? "active" : "inactive";
    lines.push(`- #${entity.id} ${entity.name} [${state}] components=${entity.componentCount}`);

    for (const component of entity.components) {
      const data = formatInspectorData(component.data);
      lines.push(`  - ${component.name} enabled=${component.enabled} started=${component.started}${data}`);
    }
  }

  return lines;
}

export function formatToolingSnapshot(snapshot: ToolingSnapshot): string[] {
  const lines = formatDebugSnapshot(snapshot.debug);

  if (snapshot.inspector) {
    lines.push("", ...formatSceneInspectorSnapshot(snapshot.inspector));
  }

  if (snapshot.schemas) {
    lines.push("", ...formatComponentSchemaSnapshot(snapshot.schemas));
  }

  return lines;
}

export function createComponentSchemaSnapshot(registry: ComponentSchemaRegistry): ComponentSchemaSnapshot {
  const schemas = registry.list().map((schema) => ({
    ...schema,
    fields: schema.fields.map((field) => ({ ...field }))
  }));

  return {
    count: schemas.length,
    schemas
  };
}

export function formatComponentSchemaSnapshot(snapshot: ComponentSchemaSnapshot): string[] {
  const lines = [`Component Schemas ${snapshot.count}`];

  for (const schema of snapshot.schemas) {
    const label = schema.label ? ` (${schema.label})` : "";
    lines.push(`- ${schema.id}: ${schema.component}${label} fields=${schema.fields.length}`);

    for (const field of schema.fields) {
      const required = field.required ? " required" : "";
      const defaultValue = field.default === undefined ? "" : ` default=${String(field.default)}`;
      const description = field.description ? ` - ${field.description}` : "";
      lines.push(`  - ${field.name}: ${field.type}${required}${defaultValue}${description}`);
    }
  }

  return lines;
}

function createTimeSnapshot(game: Game): DebugTimeSnapshot {
  const delta = game.time.delta;
  return {
    delta,
    elapsed: game.time.elapsed,
    fixedDelta: game.time.fixedDelta,
    fps: delta > 0 ? Math.round(1 / delta) : 0,
    paused: game.time.paused,
    scale: game.time.scale
  };
}

function createRenderSnapshot(renderScene: RenderScene): DebugRenderSnapshot {
  return {
    width: renderScene.width,
    height: renderScene.height,
    layers: Object.keys(renderScene.layers)
  };
}

function createAssetSnapshot(assets: AssetRegistry): DebugAssetSnapshot {
  const sprites = assets.listSprites().map((asset) => asset.id);
  return {
    spriteCount: sprites.length,
    sprites
  };
}

function createComponentInspectorSnapshot(component: Component): InspectorComponentSnapshot {
  return {
    name: component.constructor.name,
    enabled: component.enabled,
    started: component.started,
    destroyed: component.destroyed,
    data: extractInspectableComponentData(component)
  };
}

function extractInspectableComponentData(component: Component): Record<string, InspectorPrimitive> {
  const data: Record<string, InspectorPrimitive> = {};

  for (const [key, value] of Object.entries(component)) {
    if (COMPONENT_LIFECYCLE_FIELDS.has(key)) continue;
    if (!isInspectorPrimitive(value)) continue;

    data[key] = value;
  }

  return data;
}

function isInspectorPrimitive(value: unknown): value is InspectorPrimitive {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function formatInspectorData(data: Record<string, InspectorPrimitive>): string {
  const entries = Object.entries(data);
  if (!entries.length) return "";

  return ` data=${entries.map(([key, value]) => `${key}:${String(value)}`).join(",")}`;
}
