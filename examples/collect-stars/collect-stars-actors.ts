import type { EntityTemplate } from "@shuangxunian/leafer-game-engine/framework";
import { defineActorTemplate } from "@shuangxunian/leafer-game-engine/framework";

export const COLLECT_TILE_SIZE = 64;
export const COLLECT_TILE_LAYER_ID = "field";
export const COLLECT_TILE_ID = "field";
export const COLLECT_PLAYER_SIZE = 40;
export const COLLECT_STAR_SIZE = 28;
export const COLLECT_ROUND_SECONDS = 30;
export const COLLECT_PLAYER_SPEED = 230;
export const COLLECT_PLAYFIELD_PADDING = 24;

export type PlayfieldBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function createCollectorActorTemplate(playfield: PlayfieldBounds): EntityTemplate {
  const start = getCenteredActorPosition(playfield, COLLECT_PLAYER_SIZE);
  return defineActorTemplate({
    name: "Collector",
    x: start.x,
    y: start.y,
    width: COLLECT_PLAYER_SIZE,
    height: COLLECT_PLAYER_SIZE,
    collider: { layer: "player" }
  });
}

export function createStarActorTemplate(x: number, y: number): EntityTemplate {
  return defineActorTemplate({
    name: "Star",
    x,
    y,
    width: COLLECT_STAR_SIZE,
    height: COLLECT_STAR_SIZE,
    collider: { layer: "star" }
  });
}

export function getCenteredActorPosition(
  playfield: PlayfieldBounds,
  actorSize: number
): { x: number; y: number } {
  return {
    x: playfield.x + playfield.width / 2 - actorSize / 2,
    y: playfield.y + playfield.height / 2 - actorSize / 2
  };
}
