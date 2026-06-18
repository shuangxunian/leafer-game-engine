import { Component } from "../core/index.js";
import { TransformComponent } from "./transform.js";

export type MovementVector = {
  x: number;
  y: number;
};

export function limitMovementVector(vector: MovementVector, maxLength = 1): MovementVector {
  if (!Number.isFinite(maxLength) || maxLength < 0) {
    throw new Error("Movement vector maxLength must be a finite number greater than or equal to 0.");
  }

  const length = Math.hypot(vector.x, vector.y);
  if (length === 0 || length <= maxLength) {
    return {
      x: vector.x,
      y: vector.y
    };
  }

  const scale = maxLength / length;
  return {
    x: vector.x * scale,
    y: vector.y * scale
  };
}

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
