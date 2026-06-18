import { Component } from "@shuangxunian/leafer-game-engine/core";
import type { InputActionMap } from "@shuangxunian/leafer-game-engine/framework";
import {
  InputSystem,
  SizeComponent,
  TransformComponent,
  limitMovementVector
} from "@shuangxunian/leafer-game-engine/framework";
import { COLLECT_PLAYER_SPEED } from "./collect-stars-actors.js";
import type { PlayfieldBounds } from "./collect-stars-actors.js";
import { COLLECT_INPUT_ACTION } from "./input-actions.js";

export class CollectStarsPlayerController extends Component {
  constructor(
    private readonly inputActions: InputActionMap,
    private readonly bounds: PlayfieldBounds,
    private readonly canMove: () => boolean
  ) {
    super();
  }

  update(dt: number): void {
    if (!this.canMove()) return;

    const scene = this.scene;
    const transform = this.entity?.getComponent(TransformComponent);
    const size = this.entity?.getComponent(SizeComponent);
    if (!scene || !transform || !size) return;

    const input = scene.getSystem(InputSystem);
    if (!input) return;

    let dx = 0;
    let dy = 0;
    if (this.inputActions.isPressed(input, COLLECT_INPUT_ACTION.MoveLeft)) dx -= 1;
    if (this.inputActions.isPressed(input, COLLECT_INPUT_ACTION.MoveRight)) dx += 1;
    if (this.inputActions.isPressed(input, COLLECT_INPUT_ACTION.MoveUp)) dy -= 1;
    if (this.inputActions.isPressed(input, COLLECT_INPUT_ACTION.MoveDown)) dy += 1;

    const movement = limitMovementVector({ x: dx, y: dy });
    transform.x = clamp(
      transform.x + movement.x * COLLECT_PLAYER_SPEED * dt,
      this.bounds.x,
      this.bounds.x + this.bounds.width - size.width
    );
    transform.y = clamp(
      transform.y + movement.y * COLLECT_PLAYER_SPEED * dt,
      this.bounds.y,
      this.bounds.y + this.bounds.height - size.height
    );
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
