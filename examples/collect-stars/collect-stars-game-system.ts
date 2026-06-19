import { System } from "@shuangxunian/leafer-game-engine/core";
import type { Entity, Scene } from "@shuangxunian/leafer-game-engine/core";
import type { RenderAdapter, RenderScene, RenderText } from "@shuangxunian/leafer-game-engine/adapter";
import type { GameFlowPhase, InputActionMap } from "@shuangxunian/leafer-game-engine/framework";
import {
  CollisionSystem,
  GameFlow,
  InputSystem,
  TransformComponent,
  attachActorSpriteView,
  instantiateEntityTemplate,
  randomPositionInBounds
} from "@shuangxunian/leafer-game-engine/framework";
import {
  COLLECT_PLAYER_SIZE,
  COLLECT_ROUND_SECONDS,
  COLLECT_STAR_SIZE,
  createStarActorTemplate,
  getCenteredActorPosition
} from "./collect-stars-actors.js";
import type { PlayfieldBounds } from "./collect-stars-actors.js";
import { COLLECT_INPUT_ACTION } from "./input-actions.js";

export type CollectStarsHud = {
  score: RenderText;
  status: RenderText;
};

export type CollectStarsGameplaySnapshot = {
  phase: GameFlowPhase;
  score: number;
  timeRemainingSeconds: number;
  roundSeconds: number;
  hasActiveStar: boolean;
  isGameplayActive: boolean;
};

export class CollectStarsGameSystem extends System {
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

  getGameplaySnapshot(): CollectStarsGameplaySnapshot {
    return {
      phase: this.flow.getPhase(),
      score: this.score,
      timeRemainingSeconds: this.timeRemaining,
      roundSeconds: COLLECT_ROUND_SECONDS,
      hasActiveStar: this.star !== undefined,
      isGameplayActive: this.flow.is("running")
    };
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
    const start = getCenteredActorPosition(this.playfield, COLLECT_PLAYER_SIZE);
    if (transform) {
      transform.x = start.x;
      transform.y = start.y;
    }
  }

  private spawnStar(): void {
    this.clearStar();
    const maxStarY = this.playfield.y + this.playfield.height - COLLECT_STAR_SIZE;
    const minStarY = Math.min(this.playfield.y + 72, maxStarY);
    const position = randomPositionInBounds(
      {
        x: this.playfield.x,
        y: minStarY,
        width: this.playfield.width,
        height: this.playfield.y + this.playfield.height - minStarY
      },
      {
        width: COLLECT_STAR_SIZE,
        height: COLLECT_STAR_SIZE
      }
    );
    const star = instantiateEntityTemplate(this.scene, createStarActorTemplate(position.x, position.y));
    attachActorSpriteView(star, {
      renderAdapter: this.renderAdapter,
      renderScene: this.renderScene,
      asset: {
        id: "collect-star",
        fill: "#82f7ff",
        width: COLLECT_STAR_SIZE,
        height: COLLECT_STAR_SIZE,
        cornerRadius: 14
      }
    });
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
