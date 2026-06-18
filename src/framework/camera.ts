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

export type CameraBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
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
  private bounds?: CameraBounds;
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
    this.applyCenter(x, y);
  }

  setZoom(zoom: number): void {
    this.zoom = Math.max(0.01, zoom);
    this.applyCenter(this.x, this.y);
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

  setBounds(bounds: CameraBounds): void {
    this.bounds = copyCameraBounds(bounds);
    this.applyCenter(this.x, this.y);
  }

  getBounds(): CameraBounds | undefined {
    return this.bounds ? copyCameraBounds(this.bounds) : undefined;
  }

  clearBounds(): void {
    this.bounds = undefined;
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
        this.applyCenter(transform.x + this.followOffsetX, transform.y + this.followOffsetY);
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

  private applyCenter(x: number, y: number): void {
    const center = this.clampCenter(x, y);
    this.x = center.x;
    this.y = center.y;
  }

  private clampCenter(x: number, y: number): CameraPoint {
    if (!this.bounds) {
      return { x, y };
    }

    const visibleWorldWidth = this.renderScene.width / this.zoom;
    const visibleWorldHeight = this.renderScene.height / this.zoom;

    return {
      x: clampCameraAxis(
        x,
        this.bounds.x,
        this.bounds.x + this.bounds.width,
        visibleWorldWidth
      ),
      y: clampCameraAxis(
        y,
        this.bounds.y,
        this.bounds.y + this.bounds.height,
        visibleWorldHeight
      )
    };
  }
}

function copyCameraBounds(bounds: CameraBounds): CameraBounds {
  return {
    x: bounds.x,
    y: bounds.y,
    width: Math.max(0, bounds.width),
    height: Math.max(0, bounds.height)
  };
}

function clampCameraAxis(center: number, min: number, max: number, visibleSize: number): number {
  const boundsSize = max - min;
  if (boundsSize <= visibleSize) {
    return min + boundsSize / 2;
  }

  const halfVisibleSize = visibleSize / 2;
  return Math.max(min + halfVisibleSize, Math.min(max - halfVisibleSize, center));
}
