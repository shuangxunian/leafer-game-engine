import { Scene } from "@shuangxunian/leafer-game-engine/core";
import type { Entity } from "@shuangxunian/leafer-game-engine/core";
import type { RenderAdapter, RenderScene } from "@shuangxunian/leafer-game-engine/adapter";
import {
  GameFlow,
  attachActorSpriteView,
  createHudText,
  createSceneRuntimePreset,
  createTileMap,
  createTileMapLayerView,
  instantiateEntityTemplate
} from "@shuangxunian/leafer-game-engine/framework";
import {
  COLLECT_PLAYFIELD_PADDING,
  COLLECT_PLAYER_SIZE,
  COLLECT_TILE_ID,
  COLLECT_TILE_LAYER_ID,
  COLLECT_TILE_SIZE,
  createCollectorActorTemplate
} from "./collect-stars-actors.js";
import type { PlayfieldBounds } from "./collect-stars-actors.js";
import { CollectStarsGameSystem } from "./collect-stars-game-system.js";
import type { CollectStarsGameplaySnapshot } from "./collect-stars-game-system.js";
import { createCollectStarsInputActions } from "./input-actions.js";
import { CollectStarsPlayerController } from "./player-controller.js";

export class CollectStarsScene extends Scene {
  private readonly flow = new GameFlow({ initialPhase: "ready" });
  private readonly inputActions = createCollectStarsInputActions();
  private gameSystem?: CollectStarsGameSystem;

  get gameFlow(): GameFlow {
    return this.flow;
  }

  getGameplaySnapshot(): CollectStarsGameplaySnapshot | undefined {
    return this.gameSystem?.getGameplaySnapshot();
  }

  constructor(
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene
  ) {
    super("CollectStarsScene");
  }

  protected onStart(): void {
    createSceneRuntimePreset(this, {
      input: true,
      collisions: true,
      runtimeServices: true
    });
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

    this.gameSystem = new CollectStarsGameSystem(
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
    );
    this.addSystem(this.gameSystem);
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
    const player = instantiateEntityTemplate(this, createCollectorActorTemplate(playfield));
    player.addComponent(
      new CollectStarsPlayerController(
        this.inputActions,
        playfield,
        () => this.flow.is("running")
      )
    );
    attachActorSpriteView(player, {
      renderAdapter: this.renderAdapter,
      renderScene: this.renderScene,
      asset: {
        id: "collector-player",
        fill: "#f8d66d",
        width: COLLECT_PLAYER_SIZE,
        height: COLLECT_PLAYER_SIZE,
        cornerRadius: 20
      }
    });
    return player;
  }
}
