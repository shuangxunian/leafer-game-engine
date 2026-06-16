import type { RenderScene } from "../adapter/index.js";
import type { Game, Scene } from "../core/index.js";
import type { AssetRegistry } from "../framework/index.js";

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
