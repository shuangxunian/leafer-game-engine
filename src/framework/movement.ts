import { Component } from "../core/index.js";
import { TransformComponent } from "./transform.js";

export class VelocityComponent extends Component {
  constructor(
    public vx = 0,
    public vy = 0,
    private readonly canMove?: () => boolean
  ) {
    super();
  }

  update(dt: number): void {
    if (this.canMove && !this.canMove()) return;

    const transform = this.entity?.getComponent(TransformComponent);
    if (!transform) return;

    transform.x += this.vx * dt;
    transform.y += this.vy * dt;
  }
}
