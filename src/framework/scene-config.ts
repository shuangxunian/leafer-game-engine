import type { Entity, Scene, System } from "../core/index.js";
import type { AssetLoadResult, AssetManifest, AssetRegistry } from "./assets.js";
import { loadAssetManifest } from "./assets.js";
import type { EntityTemplate, EntityTemplateRegistry } from "./factory.js";
import { instantiateEntityTemplate } from "./factory.js";

export type SceneConfigSystem<TData = unknown> = {
  type: string;
  data?: TData;
};

export type SceneConfig = {
  assets?: AssetManifest;
  entities?: EntityTemplate[];
  systems?: SceneConfigSystem[];
};

export type SceneSystemFactory<TData = unknown> = (scene: Scene, data: TData) => System;

export type SceneBootstrapOptions = {
  assets?: AssetRegistry;
  entityRegistry?: EntityTemplateRegistry;
  systemRegistry?: SceneSystemRegistry;
};

export type SceneBootstrapResult = {
  assets?: AssetLoadResult;
  entities: Entity[];
  systems: System[];
};

export class SceneSystemRegistry {
  private readonly factories = new Map<string, SceneSystemFactory>();

  register<TData>(type: string, factory: SceneSystemFactory<TData>): this {
    const normalized = normalizeConfigType(type);
    if (!normalized) {
      throw new Error("Scene config system type must be a non-empty string.");
    }

    this.factories.set(normalized, factory as SceneSystemFactory);
    return this;
  }

  create(scene: Scene, system: SceneConfigSystem): System {
    const normalized = normalizeConfigType(system.type);
    const factory = normalized ? this.factories.get(normalized) : undefined;
    if (!factory) {
      throw new Error(`Unknown scene config system type "${system.type}".`);
    }

    return factory(scene, system.data);
  }
}

export function bootstrapSceneFromConfig(
  scene: Scene,
  config: SceneConfig,
  options: SceneBootstrapOptions = {}
): SceneBootstrapResult {
  const assetResult = options.assets && config.assets
    ? loadAssetManifest(options.assets, config.assets)
    : undefined;

  if (assetResult && !assetResult.ok) {
    return {
      assets: assetResult,
      entities: [],
      systems: []
    };
  }

  const entities = (config.entities ?? []).map((template) =>
    instantiateEntityTemplate(scene, template, { registry: options.entityRegistry })
  );
  const systems = (config.systems ?? []).map((system) => {
    if (!options.systemRegistry) {
      throw new Error(`Cannot bootstrap scene system "${system.type}" without a SceneSystemRegistry.`);
    }

    return scene.addSystem(options.systemRegistry.create(scene, system));
  });

  return {
    assets: assetResult,
    entities,
    systems
  };
}

function normalizeConfigType(type: string): string {
  return type.trim().toLowerCase();
}
