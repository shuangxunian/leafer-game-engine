import { Component } from "../core/index.js";
import type { RenderNode, RenderSpriteAsset } from "../adapter/index.js";
import { SizeComponent } from "./size.js";
import { TransformComponent } from "./transform.js";

export type SpriteCapableRenderNode = RenderNode & {
  setAsset(asset: string | RenderSpriteAsset): void;
};

export function isSpriteCapableRenderNode(node: unknown): node is SpriteCapableRenderNode {
  return Boolean(node && typeof (node as Partial<SpriteCapableRenderNode>).setAsset === "function");
}

export class ViewComponent extends Component {
  constructor(public readonly node: RenderNode) {
    super();
  }

  protected override getRequiredComponents() {
    return [TransformComponent];
  }

  syncFromTransform(transform: TransformComponent, size?: SizeComponent): void {
    this.node.x = transform.x;
    this.node.y = transform.y;
    this.node.rotation = transform.rotation;
    this.node.scaleX = transform.scaleX;
    this.node.scaleY = transform.scaleY;

    if (size) {
      this.node.width = size.width;
      this.node.height = size.height;
    }
  }

  lateUpdate(): void {
    const transform = this.entity?.getComponent(TransformComponent);
    if (!transform) return;

    this.syncFromTransform(transform, this.entity?.getComponent(SizeComponent));
  }

  override destroy(): void {
    this.node.destroy();
  }
}
