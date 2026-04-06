import type { Scene } from "../core/index.js";

export type DebugSnapshot = {
  sceneName: string;
  entityCount: number;
  systemCount: number;
};

export function createDebugSnapshot(scene: Scene): DebugSnapshot {
  return {
    sceneName: scene.name,
    entityCount: scene.world.entities.length,
    systemCount: scene.systems.length
  };
}
