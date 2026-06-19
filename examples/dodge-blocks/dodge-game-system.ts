import type { Entity, Scene } from "@shuangxunian/leafer-game-engine/core";
import { System } from "@shuangxunian/leafer-game-engine/core";
import type { RenderAdapter, RenderScene, RenderText } from "@shuangxunian/leafer-game-engine/adapter";
import type { GameFlowPhase, InputActionMap } from "@shuangxunian/leafer-game-engine/framework";
import {
  AssetRegistry,
  CollisionSystem,
  GameFlow,
  InputSystem,
  ColliderComponent,
  TransformComponent,
  clampPositionToBounds,
  getAudioRuntime,
  randomPositionInBounds
} from "@shuangxunian/leafer-game-engine/framework";
import { hazardFactory } from "./factories.js";
import { DODGE_INPUT_ACTION } from "./input-actions.js";

const PLAYER_SIZE = 52;
const HAZARD_MIN_SIZE = 28;
const HAZARD_MAX_SIZE = 74;
const HAZARD_MIN_SPEED = 170;
const HAZARD_MAX_SPEED = 320;
const BASE_SPAWN_INTERVAL = 0.55;
const MIN_SPAWN_INTERVAL = 0.22;
const DODGE_AUDIO_CUE = {
  GameStart: "game:start",
  GamePause: "game:pause",
  GameResume: "game:resume",
  PlayerHit: "player:hit"
} as const;

type Hud = {
  score: RenderText;
  status: RenderText;
  overlayTitle: RenderText;
  overlayBody: RenderText;
  overlayAction: RenderText;
};

type DodgeLevelRuntime = {
  playerSpawn: {
    x: number;
    y: number;
  };
  playfield: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  hazardSpawnRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type DodgeGameplaySnapshot = {
  phase: GameFlowPhase;
  score: number;
  bestScore: number;
  survivalTimeSeconds: number;
  hazardCount: number;
  isGameplayActive: boolean;
};

export class DodgeGameSystem extends System {
  override priority = 200;
  private spawnTimer = 0;
  private survivalTime = 0;
  private bestScore = 0;
  private readonly hazards = new Set<Entity>();
  private readonly flow: GameFlow;

  constructor(
    scene: Scene,
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene,
    private readonly player: Entity,
    private readonly hud: Hud,
    private readonly inputActions: InputActionMap,
    private readonly assets?: AssetRegistry,
    private readonly level?: DodgeLevelRuntime
  ) {
    super(scene);
    this.flow = new GameFlow({
      initialPhase: "ready",
      onTransition: () => this.updateHud()
    });
  }

  get gameFlow(): GameFlow {
    return this.flow;
  }

  getGameplaySnapshot(): DodgeGameplaySnapshot {
    return {
      phase: this.flow.getPhase(),
      score: this.getScore(),
      bestScore: this.bestScore,
      survivalTimeSeconds: this.survivalTime,
      hazardCount: this.hazards.size,
      isGameplayActive: this.isGameplayActive()
    };
  }

  override start(): void {
    this.resetRunState();
    this.updateHud();
  }

  override update(dt: number): void {
    const input = this.scene.getSystem(InputSystem);
    if (!input) return;

    if (this.inputActions.wasPressed(input, DODGE_INPUT_ACTION.Pause)) {
      if (this.flow.is("running")) {
        this.playAudioCue(DODGE_AUDIO_CUE.GamePause);
        this.flow.pause();
      } else if (this.flow.is("paused")) {
        this.playAudioCue(DODGE_AUDIO_CUE.GameResume);
        this.flow.resume();
      }
    }

    if (this.flow.is("ready") && this.inputActions.wasPressed(input, DODGE_INPUT_ACTION.Confirm)) {
      this.startRun();
      return;
    }

    if (this.flow.is("ended") && this.inputActions.wasPressed(input, DODGE_INPUT_ACTION.Confirm)) {
      this.startRun();
      return;
    }

    if (!this.flow.canUpdateGameplay()) return;

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
    if (!this.flow.canUpdateGameplay()) return;

    const collisions = this.scene.getSystem(CollisionSystem);
    if (!collisions) return;

    if (collisions.hasCollision(this.player, "hazard")) {
      this.bestScore = Math.max(this.bestScore, this.getScore());
      this.playAudioCue(DODGE_AUDIO_CUE.PlayerHit);
      this.flow.end();
    }
  }

  isGameplayActive(): boolean {
    return this.flow.canUpdateGameplay();
  }

  private startRun(): void {
    this.clearHazards();
    this.resetRunState();
    this.playAudioCue(DODGE_AUDIO_CUE.GameStart);
    this.flow.start();
  }

  private playAudioCue(cueId: string): void {
    getAudioRuntime(this.scene)?.playCue(cueId);
  }

  private resetRunState(): void {
    this.spawnTimer = 0;
    this.survivalTime = 0;

    const transform = this.player.getComponent(TransformComponent);
    if (transform) {
      const playfield = this.level?.playfield ?? {
        x: 18,
        y: 18,
        width: Math.max(0, this.renderScene.width - 36),
        height: Math.max(0, this.renderScene.height - 36)
      };
      const startX = this.level?.playerSpawn.x ?? 120;
      const startY = this.level?.playerSpawn.y ?? this.renderScene.height / 2 - PLAYER_SIZE / 2;
      const position = clampPositionToBounds(
        { x: startX, y: startY },
        playfield,
        { width: PLAYER_SIZE, height: PLAYER_SIZE }
      );

      transform.x = position.x;
      transform.y = position.y;
    }
  }

  private spawnHazard(): void {
    const size = randomBetween(HAZARD_MIN_SIZE, HAZARD_MAX_SIZE);
    const spawnRegion = this.level?.hazardSpawnRegion;
    const spawnBounds = spawnRegion
      ? {
        x: spawnRegion.x,
        y: spawnRegion.y - size,
        width: spawnRegion.width,
        height: spawnRegion.height + size
      }
      : {
        x: 24,
        y: -size - 120,
        width: Math.max(0, this.renderScene.width - 48),
        height: 100 + size
      };
    const position = randomPositionInBounds(spawnBounds, {
      width: size,
      height: size
    });
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
        x: position.x,
        y: position.y
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

    if (this.flow.is("ready")) {
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

    if (this.flow.is("ended")) {
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
  playerSize: PLAYER_SIZE
};
