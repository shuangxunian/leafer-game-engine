import { Scene } from "@shuangxunian/leafer-game-engine/core";
import type { RenderAdapter, RenderScene } from "@shuangxunian/leafer-game-engine/adapter";
import {
  GameFlow,
  InputSystem,
  createHudText,
  createTileMap,
  createTileMapLayerView
} from "@shuangxunian/leafer-game-engine/framework";

const COLLECT_TILE_SIZE = 64;
const COLLECT_TILE_LAYER_ID = "field";
const COLLECT_TILE_ID = "field";

export class CollectStarsScene extends Scene {
  private readonly flow = new GameFlow({ initialPhase: "ready" });

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
    this.createPlayfieldLayer();
    this.createPlayerMarker();

    createHudText(this.renderAdapter, this.renderScene, {
      text: "Collect Stars",
      x: 24,
      y: 22,
      fontSize: 30
    });
    createHudText(this.renderAdapter, this.renderScene, {
      text: "Shell baseline: movement, collectibles, scoring, and hazards land in v0.25.2.",
      x: 24,
      y: 62,
      fontSize: 18
    });
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

  private createPlayerMarker(): void {
    const marker = this.renderAdapter.createSprite();
    marker.setAsset({
      id: "collector-shell-player",
      fill: "#f8d66d",
      width: 40,
      height: 40,
      cornerRadius: 20
    });
    marker.x = Math.max(24, this.renderScene.width / 2 - 20);
    marker.y = Math.max(96, this.renderScene.height / 2 - 20);
    this.renderScene.layers.world.addChild(marker);
  }
}
