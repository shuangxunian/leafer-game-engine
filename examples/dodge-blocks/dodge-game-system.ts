import type { Entity, Scene } from "../../src/core/index.js";
import { System } from "../../src/core/index.js";
import type { RenderAdapter, RenderScene, RenderText } from "../../src/adapter/index.js";
import {
  AssetRegistry,
  CollisionSystem,
  InputSystem,
  StateMachine,
  ColliderComponent,
  TransformComponent
} from "../../src/framework/index.js";
import { hazardFactory } from "./factories.js";

const PLAYER_SIZE = 52;
const HAZARD_MIN_SIZE = 28;
const HAZARD_MAX_SIZE = 74;
const HAZARD_MIN_SPEED = 170;
const HAZARD_MAX_SPEED = 320;
const BASE_SPAWN_INTERVAL = 0.55;
const MIN_SPAWN_INTERVAL = 0.22;

type Phase = "start" | "running" | "paused" | "gameover";

type Hud = {
  score: RenderText;
  status: RenderText;
  overlayTitle: RenderText;
  overlayBody: RenderText;
  overlayAction: RenderText;
};

export class DodgeGameSystem extends System {
  override priority = 200;
  private spawnTimer = 0;
  private survivalTime = 0;
  private bestScore = 0;
  private readonly hazards = new Set<Entity>();
  private readonly flow: StateMachine<Phase>;

  constructor(
    scene: Scene,
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene,
    private readonly player: Entity,
    private readonly hud: Hud,
    private readonly assets?: AssetRegistry
  ) {
    super(scene);
    this.flow = new StateMachine<Phase>("start", {
      onTransition: () => this.updateHud()
    });
  }

  override start(): void {
    this.resetRunState();
    this.updateHud();
  }

  override update(dt: number): void {
    const input = this.scene.getSystem(InputSystem);
    if (!input) return;

    if (input.wasPressed("p") || input.wasPressed("escape")) {
      if (this.flow.is("running")) this.flow.transition("paused");
      else if (this.flow.is("paused")) this.flow.transition("running");
    }

    if (this.flow.is("start") && (input.wasPressed(" ") || input.wasPressed("enter"))) {
      this.startRun();
      return;
    }

    if (this.flow.is("gameover") && (input.wasPressed(" ") || input.wasPressed("enter"))) {
      this.startRun();
      return;
    }

    if (!this.flow.is("running")) return;

    this.survivalTime += dt;
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.getSpawnInterval()) {
      this.spawnTimer = 0;
      this.spawnHazard();
    }

    for (const hazard of [...this.hazards]) {
      const hazardRect = hazard.getComponent(ColliderComponent)?.getRect();
      if (!hazardRect) continue;

      if (hazardRect.y > this.renderScene.height + 100) {
        this.removeHazard(hazard);
        continue;
      }
    }

    this.bestScore = Math.max(this.bestScore, this.getScore());
    this.updateHud();
  }

  override lateUpdate(): void {
    if (!this.flow.is("running")) return;

    const collisions = this.scene.getSystem(CollisionSystem);
    if (!collisions) return;

    if (collisions.hasCollision(this.player, "hazard")) {
      this.bestScore = Math.max(this.bestScore, this.getScore());
      this.flow.transition("gameover");
    }
  }

  isGameplayActive(): boolean {
    return this.flow.is("running");
  }

  private startRun(): void {
    this.clearHazards();
    this.resetRunState();
    this.flow.transition("running");
  }

  private resetRunState(): void {
    this.spawnTimer = 0;
    this.survivalTime = 0;

    const transform = this.player.getComponent(TransformComponent);
    if (transform) {
      transform.x = clamp(120, 18, this.renderScene.width - PLAYER_SIZE - 18);
      transform.y = clamp(
        this.renderScene.height / 2 - PLAYER_SIZE / 2,
        18,
        this.renderScene.height - PLAYER_SIZE - 18
      );
    }
  }

  private spawnHazard(): void {
    const size = randomBetween(HAZARD_MIN_SIZE, HAZARD_MAX_SIZE);
    const minX = 24;
    const maxX = Math.max(minX, this.renderScene.width - size - 24);
    const hazard = hazardFactory.create(
      {
        scene: this.scene,
        assets: this.assets,
        renderAdapter: this.renderAdapter,
        renderScene: this.renderScene
      },
      {
        canMove: () => this.isGameplayActive(),
        name: `Hazard-${this.hazards.size + 1}`,
        size,
        speedY: randomBetween(HAZARD_MIN_SPEED, HAZARD_MAX_SPEED),
        x: randomBetween(minX, maxX),
        y: -size - randomBetween(20, 120)
      }
    );

    this.hazards.add(hazard);
  }

  private clearHazards(): void {
    for (const hazard of [...this.hazards]) {
      this.removeHazard(hazard);
    }
  }

  private removeHazard(hazard: Entity): void {
    this.hazards.delete(hazard);
    this.scene.world.destroyEntity(hazard);
  }

  private getScore(): number {
    return Math.floor(this.survivalTime * 100);
  }

  private getSpawnInterval(): number {
    const interval = BASE_SPAWN_INTERVAL - this.survivalTime * 0.015;
    return Math.max(MIN_SPAWN_INTERVAL, interval);
  }

  private updateHud(): void {
    const score = this.getScore();
    this.hud.score.setText(`Score ${score}   Best ${this.bestScore}`);

    if (this.flow.is("start")) {
      this.hud.status.setText("Move with WASD or arrow keys. Pause with P or Esc.");
      this.hud.overlayTitle.visible = true;
      this.hud.overlayBody.visible = true;
      this.hud.overlayAction.visible = true;
      this.hud.overlayTitle.setText("Dodge Blocks");
      this.hud.overlayBody.setText("Survive as long as you can while blocks rain from above.");
      this.hud.overlayAction.setText("Press Space or Enter to start");
      return;
    }

    if (this.flow.is("paused")) {
      this.hud.status.setText("Paused");
      this.hud.overlayTitle.visible = true;
      this.hud.overlayBody.visible = true;
      this.hud.overlayAction.visible = true;
      this.hud.overlayTitle.setText("Paused");
      this.hud.overlayBody.setText(`Current score ${score}. Take a breath, then jump back in.`);
      this.hud.overlayAction.setText("Press P or Esc to resume");
      return;
    }

    if (this.flow.is("gameover")) {
      this.hud.status.setText("Run ended");
      this.hud.overlayTitle.visible = true;
      this.hud.overlayBody.visible = true;
      this.hud.overlayAction.visible = true;
      this.hud.overlayTitle.setText("Game Over");
      this.hud.overlayBody.setText(`Final score ${score}. Best score ${this.bestScore}.`);
      this.hud.overlayAction.setText("Press Space or Enter to restart");
      return;
    }

    this.hud.status.setText("Survive. Press P or Esc to pause.");
    this.hud.overlayTitle.visible = false;
    this.hud.overlayBody.visible = false;
    this.hud.overlayAction.visible = false;
  }
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const DODGE_GAME_CONFIG = {
  playerSize: PLAYER_SIZE
};
