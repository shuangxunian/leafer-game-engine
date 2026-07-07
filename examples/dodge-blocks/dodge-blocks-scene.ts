import { Scene } from "@shuangxunian/leafer-game-engine/core";
import type {
  AsyncAssetManifestLoadResult,
  DefinedLevelRegion,
  DefinedLevelSpawnPoint,
  EntityTemplate,
  LevelLayout,
  SceneConfig,
  SceneConfigLevel,
  SceneConfigValidationResult,
  TileMap
} from "@shuangxunian/leafer-game-engine/framework";
import {
  AssetRegistry,
  SpriteAnimationComponent,
  SpriteAnimationSystem,
  addAudioRuntime,
  attachActorSpriteView,
  bootstrapSceneFromConfig,
  createBrowserImageSpriteLoader,
  createHudText,
  createSceneRuntimePreset,
  createTileMapLayerView,
  defineActorTemplate
} from "@shuangxunian/leafer-game-engine/framework";
import type { RenderAdapter, RenderScene } from "@shuangxunian/leafer-game-engine/adapter";
import type { InputActionMap } from "@shuangxunian/leafer-game-engine/framework";
import { DODGE_GAME_CONFIG, DodgeGameSystem } from "./dodge-game-system.js";
import { createDodgeInputActions } from "./input-actions.js";
import { PlayerControllerComponent } from "./player-controller.js";

const DODGE_LEVEL_ID = "dodge-blocks-level";
const DODGE_TILE_MAP_ID = "dodge-blocks-map";
const DODGE_TILE_LAYER_ID = "playfield";
const DODGE_PLAYFIELD_TILE_ID = "playfield";
const DODGE_PLAYER_SPAWN_ID = "player-start";
const DODGE_PLAYFIELD_REGION_ID = "playfield";
const DODGE_HAZARD_SPAWN_REGION_ID = "hazard-spawn";
const DODGE_LEVEL_PADDING = 18;
const DODGE_HAZARD_SPAWN_PADDING = 24;
const DODGE_TILE_SIZE = 64;
const DODGE_PLAYFIELD_TILE_FILL = "#143047";

const DODGE_AUDIO_CUE = {
  GameStart: "game:start",
  GamePause: "game:pause",
  GameResume: "game:resume",
  PlayerHit: "player:hit"
} as const;

const DODGE_BLOCKS_ASSET_MANIFEST = {
  sprites: [
    {
      id: "player",
      fill: "#ffcf7a",
      source: createSpriteDataUri("#ffcf7a", 52, 52, 14),
      width: DODGE_GAME_CONFIG.playerSize,
      height: DODGE_GAME_CONFIG.playerSize,
      cornerRadius: 14
    },
    {
      id: "player-focus",
      fill: "#ffe6a8",
      source: createSpriteDataUri("#ffe6a8", 52, 52, 14),
      width: DODGE_GAME_CONFIG.playerSize,
      height: DODGE_GAME_CONFIG.playerSize,
      cornerRadius: 14
    },
    {
      id: "hazard",
      fill: "#6cb7ff",
      source: createSpriteDataUri("#6cb7ff", 52, 52, 10),
      width: 52,
      height: 52,
      cornerRadius: 10
    }
  ],
  frames: [
    {
      id: "player-idle-1",
      spriteId: "player",
      width: DODGE_GAME_CONFIG.playerSize,
      height: DODGE_GAME_CONFIG.playerSize,
      durationSeconds: 0.35
    },
    {
      id: "player-idle-2",
      spriteId: "player-focus",
      width: DODGE_GAME_CONFIG.playerSize,
      height: DODGE_GAME_CONFIG.playerSize,
      durationSeconds: 0.35
    }
  ],
  clips: [
    {
      id: "player-idle",
      frameIds: ["player-idle-1", "player-idle-2"],
      loop: true
    }
  ]
};

const DODGE_BLOCKS_AUDIO_MANIFEST = {
  assets: [
    {
      id: "ui-confirm",
      source: createToneAudioDataUri(880, 0.08, 0.28),
      durationSeconds: 0.08
    },
    {
      id: "ui-pause",
      source: createToneAudioDataUri(440, 0.07, 0.22),
      durationSeconds: 0.07
    },
    {
      id: "player-hit",
      source: createToneAudioDataUri(160, 0.11, 0.35),
      durationSeconds: 0.11
    }
  ],
  channels: [
    { id: "ui", volume: 0.7 },
    { id: "sfx", volume: 0.85 }
  ],
  cues: [
    { id: DODGE_AUDIO_CUE.GameStart, assetId: "ui-confirm", channelId: "ui" },
    { id: DODGE_AUDIO_CUE.GamePause, assetId: "ui-pause", channelId: "ui" },
    { id: DODGE_AUDIO_CUE.GameResume, assetId: "ui-confirm", channelId: "ui" },
    { id: DODGE_AUDIO_CUE.PlayerHit, assetId: "player-hit", channelId: "sfx" }
  ]
};

function createPlayerTemplate(x: number, y: number): EntityTemplate {
  return defineActorTemplate({
    name: "Player",
    x,
    y,
    width: DODGE_GAME_CONFIG.playerSize,
    height: DODGE_GAME_CONFIG.playerSize,
    collider: { layer: "player" }
  });
}

type DodgeBlocksSceneConfigOptions = {
  viewportHeight: number;
  viewportWidth: number;
};

type DodgeLevelRuntime = {
  tileMap: TileMap;
  playerSpawn: DefinedLevelSpawnPoint;
  playfield: DefinedLevelRegion;
  hazardSpawnRegion?: DefinedLevelRegion;
};

export function createDodgeBlocksSceneConfig({
  viewportWidth,
  viewportHeight
}: DodgeBlocksSceneConfigOptions): SceneConfig {
  const playerStart = createPlayerStart(viewportWidth, viewportHeight);

  return {
    assets: DODGE_BLOCKS_ASSET_MANIFEST,
    level: createDodgeBlocksLevelConfig(viewportWidth, viewportHeight, playerStart),
    entities: [
      createPlayerTemplate(
        playerStart.x,
        playerStart.y
      )
    ]
  };
}

export class DodgeBlocksScene extends Scene {
  private readonly assets = createDodgeBlocksAssets();
  private readonly inputActions = createDodgeInputActions();

  get assetRegistry(): AssetRegistry {
    return this.assets;
  }

  get inputActionMap(): InputActionMap {
    return this.inputActions;
  }

  constructor(
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene
  ) {
    super("DodgeBlocksScene");
  }

  async preloadAssets(): Promise<AsyncAssetManifestLoadResult> {
    const sceneConfig = this.createSceneConfig();
    const assetResult = await this.assets.loadManifestAsync(
      sceneConfig.assets ?? {},
      createBrowserImageSpriteLoader()
    );
    if (!assetResult.ok) {
      throw new Error(
        `Failed to load dodge-blocks assets: ${formatAssetLoadFailure(assetResult)}`
      );
    }

    return assetResult;
  }

  protected onStart(): void {
    const viewportWidth = this.renderScene.width;
    const viewportHeight = this.renderScene.height;
    const sceneConfig = this.createSceneConfig();

    const bootstrapResult = bootstrapSceneFromConfig(
      this,
      { level: sceneConfig.level, entities: sceneConfig.entities },
      { validateBeforeBootstrap: true }
    );
    if (bootstrapResult.validation && !bootstrapResult.validation.ok) {
      throw new Error(
        `Invalid dodge-blocks scene config: ${formatSceneConfigValidationFailure(bootstrapResult.validation)}`
      );
    }

    const player = bootstrapResult.entities.find((entity) => entity.name === "Player");
    if (!player) {
      throw new Error("Dodge-blocks scene config did not create a Player entity.");
    }
    const levelRuntime = createDodgeLevelRuntime(bootstrapResult.level);

    createSceneRuntimePreset(this, {
      input: true,
      collisions: true
    });
    addAudioRuntime(this, {
      manifest: DODGE_BLOCKS_AUDIO_MANIFEST
    });
    this.addSystem(new SpriteAnimationSystem(this, this.assets));

    createTileMapLayerView({
      tileMap: levelRuntime.tileMap,
      layerId: DODGE_TILE_LAYER_ID,
      renderAdapter: this.renderAdapter,
      renderScene: this.renderScene,
      resolveTileAsset: (tileId) => ({
        id: tileId,
        fill: DODGE_PLAYFIELD_TILE_FILL,
        width: DODGE_TILE_SIZE,
        height: DODGE_TILE_SIZE,
        cornerRadius: 0
      })
    });

    const titleNode = createHudText(this.renderAdapter, this.renderScene, {
      text: "Dodge Blocks",
      x: 24,
      y: 20,
      fontSize: 28
    });

    const scoreNode = createHudText(this.renderAdapter, this.renderScene, {
      text: "Score 0",
      x: 24,
      y: 58,
      fontSize: 20
    });

    const statusNode = createHudText(this.renderAdapter, this.renderScene, {
      text: "Move with WASD or arrow keys. Pause with P or Esc.",
      x: 24,
      y: 88,
      fontSize: 18
    });

    const overlayTitleNode = createHudText(this.renderAdapter, this.renderScene, {
      text: "Dodge Blocks",
      x: 250,
      y: 240,
      fontSize: 42,
      layer: "overlay"
    });

    const overlayBodyNode = createHudText(this.renderAdapter, this.renderScene, {
      text: "Survive as long as you can while blocks rain from above.",
      x: 190,
      y: 300,
      fontSize: 22,
      layer: "overlay"
    });

    const overlayActionNode = createHudText(this.renderAdapter, this.renderScene, {
      text: "Press Space or Enter to start",
      x: 270,
      y: 350,
      fontSize: 24,
      layer: "overlay"
    });

    let dodgeSystem!: DodgeGameSystem;
    player.addComponent(
      new PlayerControllerComponent(
        260,
        this.inputActions,
        {
          x: levelRuntime.playfield.x,
          y: levelRuntime.playfield.y,
          width: levelRuntime.playfield.width,
          height: levelRuntime.playfield.height
        },
        () => dodgeSystem.isGameplayActive()
      )
    );
    attachActorSpriteView(player, {
      renderAdapter: this.renderAdapter,
      renderScene: this.renderScene,
      assets: this.assets,
      assetId: "player"
    });
    player.addComponent(new SpriteAnimationComponent("player-idle"));

    dodgeSystem = this.addSystem(
      new DodgeGameSystem(
        this,
        this.renderAdapter,
        this.renderScene,
        player,
        {
          score: scoreNode,
          status: statusNode,
          overlayTitle: overlayTitleNode,
          overlayBody: overlayBodyNode,
          overlayAction: overlayActionNode
        },
        this.inputActions,
        this.assets,
        {
          playerSpawn: levelRuntime.playerSpawn,
          playfield: levelRuntime.playfield,
          hazardSpawnRegion: levelRuntime.hazardSpawnRegion
        }
      )
    );
  }

  override destroy(): void {
    super.destroy();
    this.renderScene.destroy();
  }

  private createSceneConfig(): SceneConfig {
    return createDodgeBlocksSceneConfig({
      viewportHeight: this.renderScene.height,
      viewportWidth: this.renderScene.width
    });
  }
}

function createDodgeBlocksAssets(): AssetRegistry {
  return new AssetRegistry();
}

function createDodgeBlocksLevelConfig(
  viewportWidth: number,
  viewportHeight: number,
  playerStart: { x: number; y: number }
): SceneConfigLevel {
  const columns = Math.max(1, Math.ceil(viewportWidth / DODGE_TILE_SIZE));
  const rows = Math.max(1, Math.ceil(viewportHeight / DODGE_TILE_SIZE));
  const tileCount = columns * rows;
  const playfield = createPlayfieldRegion(viewportWidth, viewportHeight);

  return {
    tileMap: {
      id: DODGE_TILE_MAP_ID,
      width: columns,
      height: rows,
      tileWidth: DODGE_TILE_SIZE,
      tileHeight: DODGE_TILE_SIZE,
      layers: [
        {
          id: DODGE_TILE_LAYER_ID,
          tiles: Array.from({ length: tileCount }, () => DODGE_PLAYFIELD_TILE_ID)
        }
      ]
    },
    layout: {
      id: DODGE_LEVEL_ID,
      spawns: [
        {
          id: DODGE_PLAYER_SPAWN_ID,
          x: playerStart.x,
          y: playerStart.y
        }
      ],
      regions: [
        {
          id: DODGE_PLAYFIELD_REGION_ID,
          ...playfield,
          tags: ["playfield"]
        },
        {
          id: DODGE_HAZARD_SPAWN_REGION_ID,
          x: DODGE_HAZARD_SPAWN_PADDING,
          y: -120,
          width: Math.max(1, viewportWidth - DODGE_HAZARD_SPAWN_PADDING * 2),
          height: 120,
          tags: ["hazard-spawn"]
        }
      ]
    }
  };
}

function createDodgeLevelRuntime(level: {
  tileMap?: TileMap;
  layout?: LevelLayout;
} | undefined): DodgeLevelRuntime {
  if (!level?.tileMap) {
    throw new Error("Dodge-blocks scene config did not create a TileMap.");
  }

  if (!level.layout) {
    throw new Error("Dodge-blocks scene config did not create a LevelLayout.");
  }

  if (level.tileMap.getTile(DODGE_TILE_LAYER_ID, 0, 0) !== DODGE_PLAYFIELD_TILE_ID) {
    throw new Error("Dodge-blocks tile map did not expose the expected playfield tile.");
  }

  const playerSpawn = level.layout.getSpawnPoint(DODGE_PLAYER_SPAWN_ID);
  if (!playerSpawn) {
    throw new Error(`Dodge-blocks level layout is missing spawn "${DODGE_PLAYER_SPAWN_ID}".`);
  }

  const playfield = level.layout.getRegion(DODGE_PLAYFIELD_REGION_ID);
  if (!playfield) {
    throw new Error(`Dodge-blocks level layout is missing region "${DODGE_PLAYFIELD_REGION_ID}".`);
  }

  return {
    tileMap: level.tileMap,
    playerSpawn,
    playfield,
    hazardSpawnRegion: level.layout.getRegion(DODGE_HAZARD_SPAWN_REGION_ID)
  };
}

function createPlayerStart(viewportWidth: number, viewportHeight: number): { x: number; y: number } {
  const playfield = createPlayfieldRegion(viewportWidth, viewportHeight);

  return {
    x: clamp(120, playfield.x, playfield.x + playfield.width - DODGE_GAME_CONFIG.playerSize),
    y: clamp(
      viewportHeight / 2 - DODGE_GAME_CONFIG.playerSize / 2,
      playfield.y,
      playfield.y + playfield.height - DODGE_GAME_CONFIG.playerSize
    )
  };
}

function createPlayfieldRegion(viewportWidth: number, viewportHeight: number): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: DODGE_LEVEL_PADDING,
    y: DODGE_LEVEL_PADDING,
    width: Math.max(DODGE_GAME_CONFIG.playerSize, viewportWidth - DODGE_LEVEL_PADDING * 2),
    height: Math.max(DODGE_GAME_CONFIG.playerSize, viewportHeight - DODGE_LEVEL_PADDING * 2)
  };
}

function createSpriteDataUri(fill: string, width: number, height: number, radius: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="${fill}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createToneAudioDataUri(frequency: number, durationSeconds: number, volume: number): string {
  const sampleRate = 8000;
  const sampleCount = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const dataBytes = sampleCount * 2;
  const bytes = new Uint8Array(44 + dataBytes);
  writeAscii(bytes, 0, "RIFF");
  writeUint32(bytes, 4, 36 + dataBytes);
  writeAscii(bytes, 8, "WAVE");
  writeAscii(bytes, 12, "fmt ");
  writeUint32(bytes, 16, 16);
  writeUint16(bytes, 20, 1);
  writeUint16(bytes, 22, 1);
  writeUint32(bytes, 24, sampleRate);
  writeUint32(bytes, 28, sampleRate * 2);
  writeUint16(bytes, 32, 2);
  writeUint16(bytes, 34, 16);
  writeAscii(bytes, 36, "data");
  writeUint32(bytes, 40, dataBytes);

  for (let index = 0; index < sampleCount; index += 1) {
    const fade = Math.min(1, index / 80, (sampleCount - index) / 80);
    const sample = Math.sin((index / sampleRate) * Math.PI * 2 * frequency) * volume * fade;
    const value = Math.round(sample * 32767);
    writeInt16(bytes, 44 + index * 2, value);
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function writeAscii(bytes: Uint8Array, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    bytes[offset + index] = value.charCodeAt(index);
  }
}

function writeUint16(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
}

function writeInt16(bytes: Uint8Array, offset: number, value: number): void {
  writeUint16(bytes, offset, value < 0 ? 0x10000 + value : value);
}

function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
  bytes[offset + 2] = (value >> 16) & 0xff;
  bytes[offset + 3] = (value >> 24) & 0xff;
}

function formatAssetLoadFailure(result: AsyncAssetManifestLoadResult): string {
  const validationErrors = result.errors.map((error) => error.message);
  const loadErrors = result.loadResults
    .filter((loadResult) => loadResult.status === "failed")
    .map((loadResult) => `${loadResult.id}: ${loadResult.error ?? "Unknown error"}`);
  return [...validationErrors, ...loadErrors].join("; ") || "Unknown asset loading failure.";
}

function formatSceneConfigValidationFailure(validation: SceneConfigValidationResult): string {
  return validation.errors
    .map((error) => `${error.path}: ${error.message}`)
    .join("; ") || "Unknown scene config validation failure.";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
