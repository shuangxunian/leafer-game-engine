import { System } from "../core/index.js";

export class CameraSystem extends System {
  public x = 0;
  public y = 0;
  public zoom = 1;

  moveTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}
