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

  lateUpdate(): void {
    const transform = this.entity?.getComponent(TransformComponent);
    if (!transform) return;

    this.node.x = transform.x;
    this.node.y = transform.y;
    this.node.rotation = transform.rotation;
    this.node.scaleX = transform.scaleX;
    this.node.scaleY = transform.scaleY;

    const size = this.entity?.getComponent(SizeComponent);
    if (size) {
      this.node.width = size.width;
      this.node.height = size.height;
    }
  }

  override destroy(): void {
    this.node.destroy();
  }
}
