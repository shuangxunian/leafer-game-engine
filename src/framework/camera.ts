import type { RenderScene } from "../adapter/index.js";
import type { Entity } from "../core/index.js";
import { System } from "../core/index.js";
import { TransformComponent } from "./transform.js";

export type CameraPoint = {
  x: number;
  y: number;
};

export type CameraWorldBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type CameraViewportState = {
  x: number;
  y: number;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  worldLayerX: number;
  worldLayerY: number;
  visibleWorldBounds: CameraWorldBounds;
};

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

  getViewportState(): CameraViewportState {
    const viewportWidth = this.renderScene.width;
    const viewportHeight = this.renderScene.height;
    const worldLayerX = this.getWorldLayerX();
    const worldLayerY = this.getWorldLayerY();
    const visibleWorldWidth = viewportWidth / this.zoom;
    const visibleWorldHeight = viewportHeight / this.zoom;
    const minX = this.x - visibleWorldWidth / 2;
    const minY = this.y - visibleWorldHeight / 2;
    const maxX = minX + visibleWorldWidth;
    const maxY = minY + visibleWorldHeight;

    return {
      x: this.x,
      y: this.y,
      zoom: this.zoom,
      viewportWidth,
      viewportHeight,
      worldLayerX,
      worldLayerY,
      visibleWorldBounds: {
        x: minX,
        y: minY,
        width: visibleWorldWidth,
        height: visibleWorldHeight,
        minX,
        minY,
        maxX,
        maxY
      }
    };
  }

  worldToViewport(point: CameraPoint): CameraPoint {
    return {
      x: point.x * this.zoom + this.getWorldLayerX(),
      y: point.y * this.zoom + this.getWorldLayerY()
    };
  }

  viewportToWorld(point: CameraPoint): CameraPoint {
    return {
      x: (point.x - this.getWorldLayerX()) / this.zoom,
      y: (point.y - this.getWorldLayerY()) / this.zoom
    };
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
    worldLayer.x = this.getWorldLayerX();
    worldLayer.y = this.getWorldLayerY();
  }

  private getWorldLayerX(): number {
    return this.renderScene.width / 2 - this.x * this.zoom;
  }

  private getWorldLayerY(): number {
    return this.renderScene.height / 2 - this.y * this.zoom;
  }
}
