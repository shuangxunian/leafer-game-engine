import { Scene } from "../../src/core/index.js";
import {
  AssetRegistry,
  CameraSystem,
  ColliderComponent,
  CollisionSystem,
  InputSystem,
  SizeComponent,
  TransformComponent,
  ViewComponent
} from "../../src/framework/index.js";
import type { RenderAdapter, RenderScene } from "../../src/adapter/index.js";
import { DODGE_GAME_CONFIG, DodgeGameSystem } from "./dodge-game-system.js";
import { playerFactory } from "./factories.js";

export class DodgeBlocksScene extends Scene {
  private readonly assets = createDodgeBlocksAssets();

  constructor(
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene
  ) {
    super("DodgeBlocksScene");
  }

  protected onStart(): void {
    this.addSystem(new InputSystem(this));
    const camera = this.addSystem(new CameraSystem(this, this.renderScene));
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
    const player = playerFactory.create(
      {
        scene: this,
        assets: this.assets,
        renderAdapter: this.renderAdapter,
        renderScene: this.renderScene
      },
      {
        canMove: () => dodgeSystem.isGameplayActive(),
        height: DODGE_GAME_CONFIG.height,
        padding: 18,
        playerSize: DODGE_GAME_CONFIG.playerSize,
        speed: 260,
        width: DODGE_GAME_CONFIG.width,
        x: 120,
        y: DODGE_GAME_CONFIG.height / 2 - DODGE_GAME_CONFIG.playerSize / 2
      }
    );
    camera.follow(player, DODGE_GAME_CONFIG.playerSize / 2, DODGE_GAME_CONFIG.playerSize / 2);

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
  const assets = new AssetRegistry();
  assets.registerSprite({
    id: "player",
    fill: "#ffcf7a",
    width: DODGE_GAME_CONFIG.playerSize,
    height: DODGE_GAME_CONFIG.playerSize,
    cornerRadius: 14
  });
  assets.registerSprite({
    id: "hazard",
    fill: "#6cb7ff",
    cornerRadius: 10
  });
  return assets;
}
