import { Scene } from "../../src/core/index.js";
import type { AsyncAssetManifestLoadResult, EntityTemplate } from "../../src/framework/index.js";
import {
  AssetRegistry,
  CollisionSystem,
  InputSystem,
  ViewComponent,
  createBrowserImageSpriteLoader,
  instantiateEntityTemplate
} from "../../src/framework/index.js";
import type { RenderAdapter, RenderScene } from "../../src/adapter/index.js";
import { DODGE_GAME_CONFIG, DodgeGameSystem } from "./dodge-game-system.js";
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
      id: "hazard",
      fill: "#6cb7ff",
      source: createSpriteDataUri("#6cb7ff", 52, 52, 10),
      width: 52,
      height: 52,
      cornerRadius: 10
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

export class DodgeBlocksScene extends Scene {
  private readonly assets = createDodgeBlocksAssets();

  get assetRegistry(): AssetRegistry {
    return this.assets;
  }

  constructor(
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene
  ) {
    super("DodgeBlocksScene");
  }

  async preloadAssets(): Promise<AsyncAssetManifestLoadResult> {
    const assetResult = await this.assets.loadManifestAsync(
      DODGE_BLOCKS_ASSET_MANIFEST,
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
    this.addSystem(new InputSystem(this));
    this.addSystem(new CollisionSystem(this));
    const viewportWidth = this.renderScene.width;
    const viewportHeight = this.renderScene.height;

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
    const player = instantiateEntityTemplate(
      this,
      createPlayerTemplate(
        120,
        clamp(
          viewportHeight / 2 - DODGE_GAME_CONFIG.playerSize / 2,
          18,
          viewportHeight - DODGE_GAME_CONFIG.playerSize - 18
        )
      )
    );
    const playerNode = this.renderAdapter.createSprite("player");
    playerNode.setAsset(this.assets.requireSprite("player"));
    this.renderScene.layers.world.addChild(playerNode);
    player.addComponent(
      new PlayerControllerComponent(
        260,
        {
          width: viewportWidth,
          height: viewportHeight,
          padding: 18
        },
        () => dodgeSystem.isGameplayActive()
      )
    );
    player.addComponent(new ViewComponent(playerNode));

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
        this.assets
      )
    );
  }

  override destroy(): void {
    super.destroy();
    this.renderScene.destroy();
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
