export const RENDER_SCENE_LAYER_ORDER = ["background", "world", "ui", "overlay"] as const;

export type RenderSceneLayerName = (typeof RENDER_SCENE_LAYER_ORDER)[number];

export interface RenderNode {
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  destroy(): void;
}

export type RenderSpriteAsset = {
  id: string;
  fill?: string;
  source?: string;
  width?: number;
  height?: number;
  cornerRadius?: number;
};

export interface RenderSprite extends RenderNode {
  setAsset(asset: string | RenderSpriteAsset): void;
}

export interface RenderText extends RenderNode {
  fontSize?: number;
  setText(text: string): void;
}

export interface RenderContainer extends RenderNode {
  addChild(node: RenderNode): void;
}

export type RenderSceneLayers = Record<RenderSceneLayerName, RenderContainer>;

export type RenderSceneViewport = {
  readonly width: number;
  readonly height: number;
};

export function getRenderSceneLayerNames(renderScene: Pick<RenderScene, "layers">): RenderSceneLayerName[] {
  return RENDER_SCENE_LAYER_ORDER.filter((layerName) => layerName in renderScene.layers);
}

export function createRenderSceneViewport(width: number, height: number): RenderSceneViewport {
  return {
    width: assertRenderSceneViewportDimension("width", width),
    height: assertRenderSceneViewportDimension("height", height)
  };
}

export function getRenderSceneViewport(renderScene: Pick<RenderScene, "width" | "height">): RenderSceneViewport {
  return createRenderSceneViewport(renderScene.width, renderScene.height);
}

function assertRenderSceneViewportDimension(name: "width" | "height", value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Render scene viewport ${name} must be a finite number greater than 0.`);
  }

  return value;
}

export interface RenderScene {
  readonly root: RenderContainer;
  readonly layers: RenderSceneLayers;
  readonly width: number;
  readonly height: number;
  resize(width: number, height: number): RenderSceneViewport;
  mount(target: string | HTMLElement): void;
  destroy(): void;
}

export interface RenderAdapter {
  createScene(): RenderScene;
  createContainer(): RenderContainer;
  createSprite(assetId?: string): RenderSprite;
  createText(text?: string): RenderText;
}
