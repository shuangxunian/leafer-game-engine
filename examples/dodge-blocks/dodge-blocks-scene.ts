import { Scene } from "@shuangxunian/leafer-game-engine/core";
import type {
  AsyncAssetManifestLoadResult,
  EntityTemplate,
  SceneConfig,
  SceneConfigValidationResult
} from "@shuangxunian/leafer-game-engine/framework";
import {
  AssetRegistry,
  CollisionSystem,
  InputSystem,
  SpriteAnimationComponent,
  SpriteAnimationSystem,
  ViewComponent,
  bootstrapSceneFromConfig,
  createBrowserImageSpriteLoader,
} from "@shuangxunian/leafer-game-engine/framework";
import type { RenderAdapter, RenderScene } from "@shuangxunian/leafer-game-engine/adapter";
import type { InputActionMap } from "@shuangxunian/leafer-game-engine/framework";
import { DODGE_GAME_CONFIG, DodgeGameSystem } from "./dodge-game-system.js";
import { createDodgeInputActions } from "./input-actions.js";
import { PlayerControllerComponent } from "./player-controller.js";

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

function createPlayerTemplate(x: number, y: number): EntityTemplate {
  return {
    name: "Player",
    components: [
      {
        type: "transform",
        data: { x, y }
      },
      {
        type: "size",
        data: {
          width: DODGE_GAME_CONFIG.playerSize,
          height: DODGE_GAME_CONFIG.playerSize
        }
      },
      {
        type: "collider",
        data: { layer: "player" }
      }
    ]
  };
}

type DodgeBlocksSceneConfigOptions = {
  viewportHeight: number;
  viewportWidth: number;
};

export function createDodgeBlocksSceneConfig({
  viewportHeight
}: DodgeBlocksSceneConfigOptions): SceneConfig {
  return {
    assets: DODGE_BLOCKS_ASSET_MANIFEST,
    entities: [
      createPlayerTemplate(
        120,
        clamp(
          viewportHeight / 2 - DODGE_GAME_CONFIG.playerSize / 2,
          18,
          viewportHeight - DODGE_GAME_CONFIG.playerSize - 18
        )
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
      { entities: sceneConfig.entities },
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

    this.addSystem(new InputSystem(this));
    this.addSystem(new SpriteAnimationSystem(this, this.assets));
    this.addSystem(new CollisionSystem(this));

    const titleNode = this.renderAdapter.createText("Dodge Blocks");
    titleNode.x = 24;
    titleNode.y = 20;
    titleNode.fontSize = 28;

    const scoreNode = this.renderAdapter.createText("Score 0");
    scoreNode.x = 24;
    scoreNode.y = 58;
    scoreNode.fontSize = 20;

    const statusNode = this.renderAdapter.createText("Move with WASD or arrow keys. Pause with P or Esc.");
    statusNode.x = 24;
    statusNode.y = 88;
    statusNode.fontSize = 18;

    const overlayTitleNode = this.renderAdapter.createText("Dodge Blocks");
    overlayTitleNode.x = 250;
    overlayTitleNode.y = 240;
    overlayTitleNode.fontSize = 42;

    const overlayBodyNode = this.renderAdapter.createText("Survive as long as you can while blocks rain from above.");
    overlayBodyNode.x = 190;
    overlayBodyNode.y = 300;
    overlayBodyNode.fontSize = 22;

    const overlayActionNode = this.renderAdapter.createText("Press Space or Enter to start");
    overlayActionNode.x = 270;
    overlayActionNode.y = 350;
    overlayActionNode.fontSize = 24;

    this.renderScene.layers.ui.addChild(titleNode);
    this.renderScene.layers.ui.addChild(scoreNode);
    this.renderScene.layers.ui.addChild(statusNode);
    this.renderScene.layers.overlay.addChild(overlayTitleNode);
    this.renderScene.layers.overlay.addChild(overlayBodyNode);
    this.renderScene.layers.overlay.addChild(overlayActionNode);

    let dodgeSystem!: DodgeGameSystem;
    const playerNode = this.renderAdapter.createSprite("player");
    playerNode.setAsset(this.assets.requireSprite("player"));
    this.renderScene.layers.world.addChild(playerNode);
    player.addComponent(
      new PlayerControllerComponent(
        260,
        this.inputActions,
        {
          width: viewportWidth,
          height: viewportHeight,
          padding: 18
        },
        () => dodgeSystem.isGameplayActive()
      )
    );
    player.addComponent(new ViewComponent(playerNode));
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
        this.assets
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

function createSpriteDataUri(fill: string, width: number, height: number, radius: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" rx="${radius}" fill="${fill}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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
