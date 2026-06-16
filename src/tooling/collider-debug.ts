import type { RenderAdapter, RenderScene, RenderSprite, RenderSpriteAsset } from "../adapter/index.js";
import type { Entity, Scene } from "../core/index.js";
import { System } from "../core/index.js";
import { ColliderComponent } from "../framework/index.js";

export type ColliderDebugSystemOptions = {
  asset?: RenderSpriteAsset;
};

const DEFAULT_COLLIDER_DEBUG_ASSET: RenderSpriteAsset = {
  id: "debug-collider",
  fill: "rgba(255, 91, 91, 0.24)",
  cornerRadius: 0
};

export class ColliderDebugSystem extends System {
  override priority = 500;
  private readonly nodes = new Map<Entity, RenderSprite>();
  private readonly asset: RenderSpriteAsset;

  constructor(
    scene: Scene,
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene,
    options: ColliderDebugSystemOptions = {}
  ) {
    super(scene);
    this.asset = options.asset ?? DEFAULT_COLLIDER_DEBUG_ASSET;
  }

  override lateUpdate(): void {
    const activeEntities = new Set(this.scene.world.getEntitiesWith(ColliderComponent));

    for (const [entity, node] of [...this.nodes]) {
      if (!activeEntities.has(entity)) {
        node.destroy();
        this.nodes.delete(entity);
      }
    }

    for (const entity of activeEntities) {
      const collider = entity.getComponent(ColliderComponent);
      const rect = collider?.getRect();
      if (!rect) continue;

      const node = this.getOrCreateNode(entity);
      node.x = rect.x;
      node.y = rect.y;
      node.width = rect.width;
      node.height = rect.height;
      node.visible = true;
    }
  }

  override destroy(): void {
    for (const node of this.nodes.values()) {
      node.destroy();
    }
    this.nodes.clear();
  }

  private getOrCreateNode(entity: Entity): RenderSprite {
    const existing = this.nodes.get(entity);
    if (existing) return existing;

    const node = this.createNodeWithAsset();
    this.renderScene.layers.world.addChild(node);
    this.nodes.set(entity, node);
    return node;
  }

  private createNodeWithAsset(): RenderSprite {
    const node = this.renderAdapter.createSprite(this.asset.id);
    node.setAsset(this.asset);
    return node;
  }
}
