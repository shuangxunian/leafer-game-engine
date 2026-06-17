import type { Entity, Scene, System } from "../core/index.js";
import type { AssetLoadResult, AssetManifest, AssetRegistry } from "./assets.js";
import { AssetRegistry as AssetRegistryClass, loadAssetManifest } from "./assets.js";
import type { EntityTemplate, EntityTemplateComponent, EntityTemplateRegistry } from "./factory.js";
import { createDefaultEntityTemplateRegistry, instantiateEntityTemplate } from "./factory.js";
import type { LevelLayout, LevelLayoutDefinition } from "./level.js";
import { createLevelLayout } from "./level.js";
import type { TileMap, TileMapDefinition } from "./tile-map.js";
import { createTileMap } from "./tile-map.js";

export type SceneConfigSystem<TData = unknown> = {
  type: string;
  data?: TData;
};

export type SceneConfigLevel = {
  tileMap?: TileMapDefinition;
  layout?: LevelLayoutDefinition;
};

export type SceneConfig = {
  assets?: AssetManifest;
  level?: SceneConfigLevel;
  entities?: EntityTemplate[];
  systems?: SceneConfigSystem[];
};

export type SceneSystemFactory<TData = unknown> = (scene: Scene, data: TData) => System;

export type SceneBootstrapOptions = {
  assets?: AssetRegistry;
  entityRegistry?: EntityTemplateRegistry;
  systemRegistry?: SceneSystemRegistry;
  validateBeforeBootstrap?: boolean;
};

export type SceneBootstrapResult = {
  assets?: AssetLoadResult;
  level?: {
    tileMap?: TileMap;
    layout?: LevelLayout;
  };
  entities: Entity[];
  systems: System[];
  validation?: SceneConfigValidationResult;
};

export type SceneConfigValidationErrorCode =
  | "invalid-assets"
  | "invalid-asset-manifest"
  | "invalid-level"
  | "invalid-tile-map"
  | "invalid-level-layout"
  | "invalid-entities"
  | "invalid-entity"
  | "invalid-components"
  | "invalid-component"
  | "invalid-component-data"
  | "unknown-component"
  | "invalid-systems"
  | "invalid-system"
  | "missing-system-registry"
  | "unknown-system";

export type SceneConfigValidationError = {
  code: SceneConfigValidationErrorCode;
  path: string;
  message: string;
};

export type SceneConfigValidationResult = {
  ok: boolean;
  errors: SceneConfigValidationError[];
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

  has(type: string): boolean {
    const normalized = normalizeConfigType(type);
    return Boolean(normalized && this.factories.has(normalized));
  }
}

export function validateSceneConfig(
  config: SceneConfig,
  options: SceneBootstrapOptions = {}
): SceneConfigValidationResult {
  const errors: SceneConfigValidationError[] = [];

  validateSceneConfigAssets(config, options, errors);
  validateSceneConfigLevel(config, errors);
  validateSceneConfigEntities(config, options, errors);
  validateSceneConfigSystems(config, options, errors);

  return {
    ok: errors.length === 0,
    errors
  };
}

export function bootstrapSceneFromConfig(
  scene: Scene,
  config: SceneConfig,
  options: SceneBootstrapOptions = {}
): SceneBootstrapResult {
  const validation = options.validateBeforeBootstrap
    ? validateSceneConfig(config, options)
    : undefined;

  if (validation && !validation.ok) {
    return {
      validation,
      entities: [],
      systems: []
    };
  }

  const assetResult = options.assets && config.assets
    ? loadAssetManifest(options.assets, config.assets)
    : undefined;

  if (assetResult && !assetResult.ok) {
    return {
      validation,
      assets: assetResult,
      entities: [],
      systems: []
    };
  }

  const level = createSceneConfigLevel(config);
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
    validation,
    assets: assetResult,
    ...(level ? { level } : {}),
    entities,
    systems
  };
}

function normalizeConfigType(type: string): string {
  return type.trim().toLowerCase();
}

function validateSceneConfigAssets(
  config: SceneConfig,
  options: SceneBootstrapOptions,
  errors: SceneConfigValidationError[]
): void {
  if (config.assets === undefined) return;

  if (!isRecord(config.assets)) {
    errors.push({
      code: "invalid-assets",
      path: "assets",
      message: "Scene config assets must be an object."
    });
    return;
  }

  for (const key of ["sprites", "frames", "clips"] as const) {
    if (config.assets[key] !== undefined && !Array.isArray(config.assets[key])) {
      errors.push({
        code: "invalid-assets",
        path: `assets.${key}`,
        message: `Scene config assets.${key} must be an array.`
      });
    }
  }

  if (errors.some((error) => error.code === "invalid-assets")) return;

  const assetRegistry = cloneAssetRegistry(options.assets);
  const assetResult = loadAssetManifest(assetRegistry, config.assets);
  for (const error of assetResult.errors) {
    errors.push({
      code: "invalid-asset-manifest",
      path: error.assetId === undefined ? "assets" : `assets:${error.assetId}`,
      message: error.message
    });
  }
}

function validateSceneConfigLevel(
  config: SceneConfig,
  errors: SceneConfigValidationError[]
): void {
  if (config.level === undefined) return;

  if (!isRecord(config.level)) {
    errors.push({
      code: "invalid-level",
      path: "level",
      message: "Scene config level must be an object."
    });
    return;
  }

  if (config.level.tileMap !== undefined) {
    if (!isRecord(config.level.tileMap)) {
      errors.push({
        code: "invalid-tile-map",
        path: "level.tileMap",
        message: "Scene config level.tileMap must be an object."
      });
    } else {
      try {
        createTileMap(config.level.tileMap);
      } catch (error) {
        errors.push({
          code: "invalid-tile-map",
          path: "level.tileMap",
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  if (config.level.layout !== undefined) {
    if (!isRecord(config.level.layout)) {
      errors.push({
        code: "invalid-level-layout",
        path: "level.layout",
        message: "Scene config level.layout must be an object."
      });
    } else {
      try {
        createLevelLayout(config.level.layout);
      } catch (error) {
        errors.push({
          code: "invalid-level-layout",
          path: "level.layout",
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }
}

function validateSceneConfigEntities(
  config: SceneConfig,
  options: SceneBootstrapOptions,
  errors: SceneConfigValidationError[]
): void {
  if (config.entities === undefined) return;

  if (!Array.isArray(config.entities)) {
    errors.push({
      code: "invalid-entities",
      path: "entities",
      message: "Scene config entities must be an array."
    });
    return;
  }

  const registry = options.entityRegistry ?? createDefaultEntityTemplateRegistry();

  config.entities.forEach((entity, entityIndex) => {
    const entityPath = `entities[${entityIndex}]`;
    if (!isRecord(entity)) {
      errors.push({
        code: "invalid-entity",
        path: entityPath,
        message: "Scene config entity must be an object."
      });
      return;
    }

    if (entity.name !== undefined && typeof entity.name !== "string") {
      errors.push({
        code: "invalid-entity",
        path: `${entityPath}.name`,
        message: "Scene config entity name must be a string when provided."
      });
    }

    if (entity.components === undefined) return;

    if (!Array.isArray(entity.components)) {
      errors.push({
        code: "invalid-components",
        path: `${entityPath}.components`,
        message: "Scene config entity components must be an array."
      });
      return;
    }

    entity.components.forEach((component, componentIndex) => {
      const componentPath = `${entityPath}.components[${componentIndex}]`;
      if (!isRecord(component)) {
        errors.push({
          code: "invalid-component",
          path: componentPath,
          message: "Scene config entity component must be an object."
        });
        return;
      }

      if (typeof component.type !== "string" || !component.type.trim()) {
        errors.push({
          code: "invalid-component",
          path: `${componentPath}.type`,
          message: "Scene config entity component type must be a non-empty string."
        });
        return;
      }

      if (!registry.has(component.type)) {
        errors.push({
          code: "unknown-component",
          path: `${componentPath}.type`,
          message: `Unknown entity template component type "${component.type}".`
        });
        return;
      }

      try {
        registry.create(component as EntityTemplateComponent);
      } catch (error) {
        errors.push({
          code: "invalid-component-data",
          path: `${componentPath}.data`,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
  });
}

function validateSceneConfigSystems(
  config: SceneConfig,
  options: SceneBootstrapOptions,
  errors: SceneConfigValidationError[]
): void {
  if (config.systems === undefined) return;

  if (!Array.isArray(config.systems)) {
    errors.push({
      code: "invalid-systems",
      path: "systems",
      message: "Scene config systems must be an array."
    });
    return;
  }

  config.systems.forEach((system, systemIndex) => {
    const systemPath = `systems[${systemIndex}]`;
    if (!isRecord(system)) {
      errors.push({
        code: "invalid-system",
        path: systemPath,
        message: "Scene config system must be an object."
      });
      return;
    }

    if (typeof system.type !== "string" || !system.type.trim()) {
      errors.push({
        code: "invalid-system",
        path: `${systemPath}.type`,
        message: "Scene config system type must be a non-empty string."
      });
      return;
    }

    if (!options.systemRegistry) {
      errors.push({
        code: "missing-system-registry",
        path: `${systemPath}.type`,
        message: `Cannot validate scene system "${system.type}" without a SceneSystemRegistry.`
      });
      return;
    }

    if (!options.systemRegistry.has(system.type)) {
      errors.push({
        code: "unknown-system",
        path: `${systemPath}.type`,
        message: `Unknown scene config system type "${system.type}".`
      });
    }
  });
}

function createSceneConfigLevel(config: SceneConfig): SceneBootstrapResult["level"] {
  if (config.level === undefined) return undefined;

  if (!isRecord(config.level)) {
    throw new Error("Scene config level must be an object.");
  }

  if (config.level.tileMap !== undefined && !isRecord(config.level.tileMap)) {
    throw new Error("Scene config level.tileMap must be an object.");
  }

  if (config.level.layout !== undefined && !isRecord(config.level.layout)) {
    throw new Error("Scene config level.layout must be an object.");
  }

  const tileMap = config.level.tileMap ? createTileMap(config.level.tileMap) : undefined;
  const layout = config.level.layout ? createLevelLayout(config.level.layout) : undefined;

  if (!tileMap && !layout) return undefined;

  return {
    ...(tileMap ? { tileMap } : {}),
    ...(layout ? { layout } : {})
  };
}

function cloneAssetRegistry(registry?: AssetRegistry): AssetRegistryClass {
  const clone = new AssetRegistryClass();
  if (!registry) return clone;

  registry.listSprites().forEach((sprite) => clone.registerSprite(sprite));
  registry.listSpriteFrames().forEach((frame) => clone.registerSpriteFrame(frame));
  registry.listAnimationClips().forEach((clip) => clone.registerAnimationClip(clip));
  return clone;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
