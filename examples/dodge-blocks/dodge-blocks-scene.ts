import { Scene } from "../../src/core/index.js";
import {
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
import { PlayerControllerComponent } from "./player-controller.js";

export class DodgeBlocksScene extends Scene {
  constructor(
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene
  ) {
    super("DodgeBlocksScene");
  }

  protected onStart(): void {
    this.addSystem(new InputSystem(this));
    this.addSystem(new CameraSystem(this));
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

    const playerNode = this.renderAdapter.createSprite("player");
    this.renderScene.layers.ui.addChild(titleNode);
    this.renderScene.layers.ui.addChild(scoreNode);
    this.renderScene.layers.ui.addChild(statusNode);
    this.renderScene.layers.overlay.addChild(overlayTitleNode);
    this.renderScene.layers.overlay.addChild(overlayBodyNode);
    this.renderScene.layers.overlay.addChild(overlayActionNode);
    this.renderScene.layers.world.addChild(playerNode);

    const player = this.world.createEntity("Player");
    const transform = player.addComponent(new TransformComponent());
    transform.x = 120;
    transform.y = DODGE_GAME_CONFIG.height / 2 - DODGE_GAME_CONFIG.playerSize / 2;

    let dodgeSystem!: DodgeGameSystem;
    player.addComponent(new SizeComponent(DODGE_GAME_CONFIG.playerSize, DODGE_GAME_CONFIG.playerSize));
    player.addComponent(new ColliderComponent("player"));
    player.addComponent(
      new PlayerControllerComponent(
        260,
        {
          width: DODGE_GAME_CONFIG.width,
          height: DODGE_GAME_CONFIG.height,
          padding: 18
        },
        () => dodgeSystem.isGameplayActive()
      )
    );
    player.addComponent(new ViewComponent(playerNode));

    dodgeSystem = this.addSystem(
      new DodgeGameSystem(this, this.renderAdapter, this.renderScene, player, {
        score: scoreNode,
        status: statusNode,
        overlayTitle: overlayTitleNode,
        overlayBody: overlayBodyNode,
        overlayAction: overlayActionNode
      })
    );
  }

  override destroy(): void {
    super.destroy();
    this.renderScene.destroy();
  }
}
