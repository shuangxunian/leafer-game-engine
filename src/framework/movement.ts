import { Component } from "../core/index.js";
import { TransformComponent } from "./transform.js";

export type MovementVector = {
  x: number;
  y: number;
};

export type MovementBounds = {
  x?: number;
  y?: number;
  width: number;
  height: number;
  padding?: number;
};

export type MovementSize = {
  width?: number;
  height?: number;
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

export function clampPositionToBounds(
  position: MovementVector,
  bounds: MovementBounds,
  size: MovementSize = {}
): MovementVector {
  const boundsX = readFiniteNumber(bounds.x ?? 0, "bounds.x");
  const boundsY = readFiniteNumber(bounds.y ?? 0, "bounds.y");
  const boundsWidth = readNonNegativeFiniteNumber(bounds.width, "bounds.width");
  const boundsHeight = readNonNegativeFiniteNumber(bounds.height, "bounds.height");
  const padding = readNonNegativeFiniteNumber(bounds.padding ?? 0, "bounds.padding");
  const width = readNonNegativeFiniteNumber(size.width ?? 0, "size.width");
  const height = readNonNegativeFiniteNumber(size.height ?? 0, "size.height");

  return {
    x: clamp(position.x, boundsX + padding, boundsX + boundsWidth - width - padding),
    y: clamp(position.y, boundsY + padding, boundsY + boundsHeight - height - padding)
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

function readFiniteNumber(value: number, label: string): number {
  if (Number.isFinite(value)) return value;

  throw new Error(`Movement ${label} must be a finite number.`);
}

function readNonNegativeFiniteNumber(value: number, label: string): number {
  if (Number.isFinite(value) && value >= 0) return value;

  throw new Error(`Movement ${label} must be a finite number greater than or equal to 0.`);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
