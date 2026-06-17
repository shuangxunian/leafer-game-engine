import { Component } from "@shuangxunian/leafer-game-engine/core";
import { InputSystem, SizeComponent, TransformComponent } from "@shuangxunian/leafer-game-engine/framework";

type Bounds = {
  width: number;
  height: number;
  padding?: number;
};

export class PlayerControllerComponent extends Component {
  constructor(
    private readonly speed = 220,
    private readonly bounds?: Bounds,
    private readonly canMove?: () => boolean
  ) {
    super();
  }

  update(dt: number): void {
    if (this.canMove && !this.canMove()) return;

    const scene = this.scene;
    const transform = this.entity?.getComponent(TransformComponent);
    if (!scene || !transform) return;

    const input = scene.getSystem(InputSystem);
    if (!input) return;

    let dx = 0;
    let dy = 0;

    if (input.isPressed("a") || input.isPressed("arrowleft")) dx -= 1;
    if (input.isPressed("d") || input.isPressed("arrowright")) dx += 1;
    if (input.isPressed("w") || input.isPressed("arrowup")) dy -= 1;
    if (input.isPressed("s") || input.isPressed("arrowdown")) dy += 1;

    transform.x += dx * this.speed * dt;
    transform.y += dy * this.speed * dt;

    if (!this.bounds) return;

    const size = this.entity?.getComponent(SizeComponent);
    const width = size?.width ?? 0;
    const height = size?.height ?? 0;
    const padding = this.bounds.padding ?? 0;

    transform.x = clamp(transform.x, padding, this.bounds.width - width - padding);
    transform.y = clamp(transform.y, padding, this.bounds.height - height - padding);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
