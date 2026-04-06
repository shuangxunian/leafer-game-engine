import type { Entity, Scene } from "../../src/core/index.js";
import { System } from "../../src/core/index.js";
import type { RenderAdapter, RenderScene, RenderText } from "../../src/adapter/index.js";
import {
  ColliderComponent,
  CollisionSystem,
  InputSystem,
  SizeComponent,
  TransformComponent,
  VelocityComponent,
  ViewComponent
} from "../../src/framework/index.js";

const PLAYFIELD_WIDTH = 960;
const PLAYFIELD_HEIGHT = 640;
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
  private spawnTimer = 0;
  private survivalTime = 0;
  private bestScore = 0;
  private phase: Phase = "start";
  private readonly hazards = new Set<Entity>();

  constructor(
    scene: Scene,
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene,
    private readonly player: Entity,
    private readonly hud: Hud
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

    if (input.wasPressed("p") || input.wasPressed("escape")) {
      if (this.phase === "running") this.phase = "paused";
      else if (this.phase === "paused") this.phase = "running";
      this.updateHud();
    }

    if (this.phase === "start" && (input.wasPressed(" ") || input.wasPressed("enter"))) {
      this.startRun();
      return;
    }

    if (this.phase === "gameover" && (input.wasPressed(" ") || input.wasPressed("enter"))) {
      this.startRun();
      return;
    }

    if (this.phase !== "running") return;

    this.survivalTime += dt;
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.getSpawnInterval()) {
      this.spawnTimer = 0;
      this.spawnHazard();
    }

    for (const hazard of [...this.hazards]) {
      const hazardRect = hazard.getComponent(ColliderComponent)?.getRect();
      if (!hazardRect) continue;

      if (hazardRect.y > PLAYFIELD_HEIGHT + 100) {
        this.removeHazard(hazard);
        continue;
      }
    }

    this.bestScore = Math.max(this.bestScore, this.getScore());
    this.updateHud();
  }

  override lateUpdate(): void {
    if (this.phase !== "running") return;

    const collisions = this.scene.getSystem(CollisionSystem);
    if (!collisions) return;

    if (collisions.hasCollision(this.player, "hazard")) {
      this.phase = "gameover";
      this.bestScore = Math.max(this.bestScore, this.getScore());
      this.updateHud();
    }
  }

  isGameplayActive(): boolean {
    return this.phase === "running";
  }

  private startRun(): void {
    this.clearHazards();
    this.resetRunState();
    this.phase = "running";
    this.updateHud();
  }

  private resetRunState(): void {
    this.spawnTimer = 0;
    this.survivalTime = 0;

    const transform = this.player.getComponent(TransformComponent);
    if (transform) {
      transform.x = 120;
      transform.y = PLAYFIELD_HEIGHT / 2 - PLAYER_SIZE / 2;
    }
  }

  private spawnHazard(): void {
    const size = randomBetween(HAZARD_MIN_SIZE, HAZARD_MAX_SIZE);
    const hazardNode = this.renderAdapter.createSprite("hazard");
    this.renderScene.root.addChild(hazardNode);

    const hazard = this.scene.world.createEntity(`Hazard-${this.hazards.size + 1}`);
    const transform = hazard.addComponent(new TransformComponent());
    transform.x = randomBetween(24, PLAYFIELD_WIDTH - size - 24);
    transform.y = -size - randomBetween(20, 120);

    hazard.addComponent(new SizeComponent(size, size));
    hazard.addComponent(new ColliderComponent("hazard"));
    hazard.addComponent(
      new VelocityComponent(0, randomBetween(HAZARD_MIN_SPEED, HAZARD_MAX_SPEED), () => this.isGameplayActive())
    );
    hazard.addComponent(new ViewComponent(hazardNode));

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

    if (this.phase === "start") {
      this.hud.status.setText("Move with WASD or arrow keys. Pause with P or Esc.");
      this.hud.overlayTitle.visible = true;
      this.hud.overlayBody.visible = true;
      this.hud.overlayAction.visible = true;
      this.hud.overlayTitle.setText("Dodge Blocks");
      this.hud.overlayBody.setText("Survive as long as you can while blocks rain from above.");
      this.hud.overlayAction.setText("Press Space or Enter to start");
      return;
    }

    if (this.phase === "paused") {
      this.hud.status.setText("Paused");
      this.hud.overlayTitle.visible = true;
      this.hud.overlayBody.visible = true;
      this.hud.overlayAction.visible = true;
      this.hud.overlayTitle.setText("Paused");
      this.hud.overlayBody.setText(`Current score ${score}. Take a breath, then jump back in.`);
      this.hud.overlayAction.setText("Press P or Esc to resume");
      return;
    }

    if (this.phase === "gameover") {
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

export const DODGE_GAME_CONFIG = {
  height: PLAYFIELD_HEIGHT,
  playerSize: PLAYER_SIZE,
  width: PLAYFIELD_WIDTH
};
