import { Component, Scene, System } from "@shuangxunian/leafer-game-engine/core";
import type { Entity } from "@shuangxunian/leafer-game-engine/core";
import type { RenderAdapter, RenderScene, RenderText } from "@shuangxunian/leafer-game-engine/adapter";
import {
  ColliderComponent,
  CollisionSystem,
  GameFlow,
  InputActionMap,
  InputSystem,
  SizeComponent,
  TransformComponent,
  ViewComponent,
  createHudText,
  createTileMap,
  createTileMapLayerView,
  defineKeyboardBinding,
  limitMovementVector
} from "@shuangxunian/leafer-game-engine/framework";

const COLLECT_TILE_SIZE = 64;
const COLLECT_TILE_LAYER_ID = "field";
const COLLECT_TILE_ID = "field";
const COLLECT_PLAYER_SIZE = 40;
const COLLECT_STAR_SIZE = 28;
const COLLECT_ROUND_SECONDS = 30;
const COLLECT_PLAYER_SPEED = 230;
const COLLECT_PLAYFIELD_PADDING = 24;

const COLLECT_INPUT_ACTION = {
  MoveLeft: "move:left",
  MoveRight: "move:right",
  MoveUp: "move:up",
  MoveDown: "move:down",
  Confirm: "confirm"
} as const;

type CollectStarsHud = {
  score: RenderText;
  status: RenderText;
};

type PlayfieldBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export class CollectStarsScene extends Scene {
  private readonly flow = new GameFlow({ initialPhase: "ready" });
  private readonly inputActions = createCollectStarsInputActions();

  get gameFlow(): GameFlow {
    return this.flow;
  }

  constructor(
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene
  ) {
    super("CollectStarsScene");
  }

  protected onStart(): void {
    this.addSystem(new InputSystem(this));
    this.addSystem(new CollisionSystem(this));
    this.createPlayfieldLayer();
    const playfield = this.getPlayfieldBounds();
    const player = this.createPlayer(playfield);

    createHudText(this.renderAdapter, this.renderScene, {
      text: "Collect Stars",
      x: 24,
      y: 22,
      fontSize: 30
    });
    const scoreNode = createHudText(this.renderAdapter, this.renderScene, {
      text: "Score 0   Time 30",
      x: 24,
      y: 62,
      fontSize: 18
    });
    const statusNode = createHudText(this.renderAdapter, this.renderScene, {
      text: "Press Space or Enter to start. Move with WASD or arrow keys.",
      x: 24,
      y: 90,
      fontSize: 18
    });

    this.addSystem(
      new CollectStarsGameSystem(
        this,
        this.renderAdapter,
        this.renderScene,
        player,
        this.flow,
        this.inputActions,
        playfield,
        {
          score: scoreNode,
          status: statusNode
        }
      )
    );
  }

  override destroy(): void {
    super.destroy();
    this.renderScene.destroy();
  }

  private createPlayfieldLayer(): void {
    const columns = Math.max(1, Math.ceil(this.renderScene.width / COLLECT_TILE_SIZE));
    const rows = Math.max(1, Math.ceil(this.renderScene.height / COLLECT_TILE_SIZE));
    const tileMap = createTileMap({
      id: "collect-stars-map",
      width: columns,
      height: rows,
      tileWidth: COLLECT_TILE_SIZE,
      tileHeight: COLLECT_TILE_SIZE,
      layers: [
        {
          id: COLLECT_TILE_LAYER_ID,
          tiles: Array.from({ length: columns * rows }, () => COLLECT_TILE_ID)
        }
      ]
    });

    createTileMapLayerView({
      tileMap,
      layerId: COLLECT_TILE_LAYER_ID,
      renderAdapter: this.renderAdapter,
      renderScene: this.renderScene,
      targetLayer: "background",
      resolveTileAsset: (tileId) => ({
        id: tileId,
        fill: "#112f28",
        width: COLLECT_TILE_SIZE,
        height: COLLECT_TILE_SIZE,
        cornerRadius: 0
      })
    });
  }

  private getPlayfieldBounds(): PlayfieldBounds {
    return {
      x: COLLECT_PLAYFIELD_PADDING,
      y: COLLECT_PLAYFIELD_PADDING,
      width: Math.max(COLLECT_PLAYER_SIZE, this.renderScene.width - COLLECT_PLAYFIELD_PADDING * 2),
      height: Math.max(COLLECT_PLAYER_SIZE, this.renderScene.height - COLLECT_PLAYFIELD_PADDING * 2)
    };
  }

  private createPlayer(playfield: PlayfieldBounds): Entity {
    const marker = this.renderAdapter.createSprite();
    marker.setAsset({
      id: "collector-player",
      fill: "#f8d66d",
      width: COLLECT_PLAYER_SIZE,
      height: COLLECT_PLAYER_SIZE,
      cornerRadius: 20
    });
    this.renderScene.layers.world.addChild(marker);

    const player = this.world.createEntity("Collector");
    const transform = player.addComponent(new TransformComponent());
    transform.x = playfield.x + playfield.width / 2 - COLLECT_PLAYER_SIZE / 2;
    transform.y = playfield.y + playfield.height / 2 - COLLECT_PLAYER_SIZE / 2;
    player.addComponent(new SizeComponent(COLLECT_PLAYER_SIZE, COLLECT_PLAYER_SIZE));
    player.addComponent(new ColliderComponent("player"));
    player.addComponent(
      new CollectStarsPlayerController(
        this.inputActions,
        playfield,
        () => this.flow.is("running")
      )
    );
    player.addComponent(new ViewComponent(marker));
    return player;
  }
}

class CollectStarsPlayerController extends Component {
  constructor(
    private readonly inputActions: InputActionMap,
    private readonly bounds: PlayfieldBounds,
    private readonly canMove: () => boolean
  ) {
    super();
  }

  update(dt: number): void {
    if (!this.canMove()) return;

    const scene = this.scene;
    const transform = this.entity?.getComponent(TransformComponent);
    const size = this.entity?.getComponent(SizeComponent);
    if (!scene || !transform || !size) return;

    const input = scene.getSystem(InputSystem);
    if (!input) return;

    let dx = 0;
    let dy = 0;
    if (this.inputActions.isPressed(input, COLLECT_INPUT_ACTION.MoveLeft)) dx -= 1;
    if (this.inputActions.isPressed(input, COLLECT_INPUT_ACTION.MoveRight)) dx += 1;
    if (this.inputActions.isPressed(input, COLLECT_INPUT_ACTION.MoveUp)) dy -= 1;
    if (this.inputActions.isPressed(input, COLLECT_INPUT_ACTION.MoveDown)) dy += 1;

    const movement = limitMovementVector({ x: dx, y: dy });
    transform.x = clamp(
      transform.x + movement.x * COLLECT_PLAYER_SPEED * dt,
      this.bounds.x,
      this.bounds.x + this.bounds.width - size.width
    );
    transform.y = clamp(
      transform.y + movement.y * COLLECT_PLAYER_SPEED * dt,
      this.bounds.y,
      this.bounds.y + this.bounds.height - size.height
    );
  }
}

class CollectStarsGameSystem extends System {
  override priority = 200;
  private score = 0;
  private timeRemaining = COLLECT_ROUND_SECONDS;
  private star?: Entity;

  constructor(
    scene: Scene,
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene,
    private readonly player: Entity,
    private readonly flow: GameFlow,
    private readonly inputActions: InputActionMap,
    private readonly playfield: PlayfieldBounds,
    private readonly hud: CollectStarsHud
  ) {
    super(scene);
  }

  override start(): void {
    this.resetRunState();
    this.updateHud();
  }

  override update(dt: number): void {
    const input = this.scene.getSystem(InputSystem);
    if (!input) return;

    if (this.flow.matches("ready", "ended") && this.inputActions.wasPressed(input, COLLECT_INPUT_ACTION.Confirm)) {
      this.startRun();
      return;
    }

    if (!this.flow.is("running")) return;

    this.timeRemaining = Math.max(0, this.timeRemaining - dt);
    if (this.timeRemaining <= 0) {
      this.flow.end();
    }
    this.updateHud();
  }

  override lateUpdate(): void {
    if (!this.flow.is("running")) return;

    const collisions = this.scene.getSystem(CollisionSystem);
    if (!collisions?.hasCollision(this.player, "star")) return;

    this.score += 1;
    this.spawnStar();
    this.updateHud();
  }

  override destroy(): void {
    this.clearStar();
  }

  private startRun(): void {
    this.resetRunState();
    this.spawnStar();
    this.flow.start();
    this.updateHud();
  }

  private resetRunState(): void {
    this.score = 0;
    this.timeRemaining = COLLECT_ROUND_SECONDS;
    this.clearStar();

    const transform = this.player.getComponent(TransformComponent);
    if (transform) {
      transform.x = this.playfield.x + this.playfield.width / 2 - COLLECT_PLAYER_SIZE / 2;
      transform.y = this.playfield.y + this.playfield.height / 2 - COLLECT_PLAYER_SIZE / 2;
    }
  }

  private spawnStar(): void {
    this.clearStar();
    const node = this.renderAdapter.createSprite();
    node.setAsset({
      id: "collect-star",
      fill: "#82f7ff",
      width: COLLECT_STAR_SIZE,
      height: COLLECT_STAR_SIZE,
      cornerRadius: 14
    });
    this.renderScene.layers.world.addChild(node);

    const star = this.scene.world.createEntity("Star");
    const transform = star.addComponent(new TransformComponent());
    const maxStarY = this.playfield.y + this.playfield.height - COLLECT_STAR_SIZE;
    transform.x = randomBetween(this.playfield.x, this.playfield.x + this.playfield.width - COLLECT_STAR_SIZE);
    transform.y = randomBetween(Math.min(this.playfield.y + 72, maxStarY), maxStarY);
    star.addComponent(new SizeComponent(COLLECT_STAR_SIZE, COLLECT_STAR_SIZE));
    star.addComponent(new ColliderComponent("star"));
    star.addComponent(new ViewComponent(node));
    this.star = star;
  }

  private clearStar(): void {
    if (!this.star) return;
    this.scene.world.destroyEntity(this.star);
    this.star = undefined;
  }

  private updateHud(): void {
    this.hud.score.setText(`Score ${this.score}   Time ${Math.ceil(this.timeRemaining)}`);

    if (this.flow.is("ready")) {
      this.hud.status.setText("Press Space or Enter to start. Move with WASD or arrow keys.");
      return;
    }

    if (this.flow.is("ended")) {
      this.hud.status.setText(`Run ended. Final score ${this.score}. Press Space or Enter to restart.`);
      return;
    }

    this.hud.status.setText("Collect as many stars as you can before time runs out.");
  }
}

function createCollectStarsInputActions(): InputActionMap {
  return new InputActionMap([
    {
      id: COLLECT_INPUT_ACTION.MoveLeft,
      bindings: [defineKeyboardBinding("a"), defineKeyboardBinding("arrowleft")]
    },
    {
      id: COLLECT_INPUT_ACTION.MoveRight,
      bindings: [defineKeyboardBinding("d"), defineKeyboardBinding("arrowright")]
    },
    {
      id: COLLECT_INPUT_ACTION.MoveUp,
      bindings: [defineKeyboardBinding("w"), defineKeyboardBinding("arrowup")]
    },
    {
      id: COLLECT_INPUT_ACTION.MoveDown,
      bindings: [defineKeyboardBinding("s"), defineKeyboardBinding("arrowdown")]
    },
    {
      id: COLLECT_INPUT_ACTION.Confirm,
      bindings: [defineKeyboardBinding(" "), defineKeyboardBinding("enter")]
    }
  ]);
}

function randomBetween(min: number, max: number): number {
  if (max <= min) return min;
  return min + Math.random() * Math.max(0, max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
