import { Component } from "../core/index.js";
import type { RenderNode } from "../adapter/index.js";
import { SizeComponent } from "./size.js";
import { TransformComponent } from "./transform.js";

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
