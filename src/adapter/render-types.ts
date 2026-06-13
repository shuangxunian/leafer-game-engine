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

export interface RenderSprite extends RenderNode {
  setAsset(assetId: string): void;
}

export interface RenderText extends RenderNode {
  fontSize?: number;
  setText(text: string): void;
}

export interface RenderContainer extends RenderNode {
  addChild(node: RenderNode): void;
}

export type RenderSceneLayers = {
  background: RenderContainer;
  world: RenderContainer;
  ui: RenderContainer;
  overlay: RenderContainer;
};

export interface RenderScene {
  readonly root: RenderContainer;
  readonly layers: RenderSceneLayers;
  mount(target: string | HTMLElement): void;
  destroy(): void;
}

export interface RenderAdapter {
  createScene(): RenderScene;
  createContainer(): RenderContainer;
  createSprite(assetId?: string): RenderSprite;
  createText(text?: string): RenderText;
}
