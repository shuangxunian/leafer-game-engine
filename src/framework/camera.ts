import type { RenderScene } from "../adapter/index.js";
import type { Entity } from "../core/index.js";
import { System } from "../core/index.js";
import { TransformComponent } from "./transform.js";

export class CameraSystem extends System {
  override priority = -100;
  public x = 0;
  public y = 0;
  public zoom = 1;
  private followTarget?: Entity;
  private followOffsetX = 0;
  private followOffsetY = 0;

  constructor(
    scene: System["scene"],
    private readonly renderScene: RenderScene
  ) {
    super(scene);
  }

  moveTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  setZoom(zoom: number): void {
    this.zoom = Math.max(0.01, zoom);
  }

  follow(entity: Entity, offsetX = 0, offsetY = 0): void {
    this.followTarget = entity;
    this.followOffsetX = offsetX;
    this.followOffsetY = offsetY;
  }

  clearFollow(): void {
    this.followTarget = undefined;
    this.followOffsetX = 0;
    this.followOffsetY = 0;
  }

  override lateUpdate(): void {
    if (this.followTarget) {
      const transform = this.followTarget.getComponent(TransformComponent);
      if (transform) {
        this.x = transform.x + this.followOffsetX;
        this.y = transform.y + this.followOffsetY;
      }
    }

    const worldLayer = this.renderScene.layers.world;
    worldLayer.scaleX = this.zoom;
    worldLayer.scaleY = this.zoom;
    worldLayer.x = this.renderScene.width / 2 - this.x * this.zoom;
    worldLayer.y = this.renderScene.height / 2 - this.y * this.zoom;
  }
}
