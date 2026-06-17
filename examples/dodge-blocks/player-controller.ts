import { Component } from "@shuangxunian/leafer-game-engine/core";
import type { InputActionMap } from "@shuangxunian/leafer-game-engine/framework";
import {
  InputSystem,
  SizeComponent,
  TransformComponent
} from "@shuangxunian/leafer-game-engine/framework";
import { DODGE_INPUT_ACTION } from "./input-actions.js";

type Bounds = {
  x?: number;
  y?: number;
  width: number;
  height: number;
  padding?: number;
};

export class PlayerControllerComponent extends Component {
  constructor(
    private readonly speed = 220,
    private readonly inputActions: InputActionMap,
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

    if (this.inputActions.isPressed(input, DODGE_INPUT_ACTION.MoveLeft)) dx -= 1;
    if (this.inputActions.isPressed(input, DODGE_INPUT_ACTION.MoveRight)) dx += 1;
    if (this.inputActions.isPressed(input, DODGE_INPUT_ACTION.MoveUp)) dy -= 1;
    if (this.inputActions.isPressed(input, DODGE_INPUT_ACTION.MoveDown)) dy += 1;

    transform.x += dx * this.speed * dt;
    transform.y += dy * this.speed * dt;

    if (!this.bounds) return;

    const size = this.entity?.getComponent(SizeComponent);
    const width = size?.width ?? 0;
    const height = size?.height ?? 0;
    const padding = this.bounds.padding ?? 0;
    const boundsX = this.bounds.x ?? 0;
    const boundsY = this.bounds.y ?? 0;

    transform.x = clamp(transform.x, boundsX + padding, boundsX + this.bounds.width - width - padding);
    transform.y = clamp(transform.y, boundsY + padding, boundsY + this.bounds.height - height - padding);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
