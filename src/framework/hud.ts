import type { RenderAdapter, RenderScene, RenderSceneLayerName, RenderText } from "../adapter/index.js";

export type HudTextOptions = {
  text?: string;
  x?: number;
  y?: number;
  fontSize?: number;
  visible?: boolean;
  layer?: Extract<RenderSceneLayerName, "ui" | "overlay">;
};

export function createHudText(
  renderAdapter: RenderAdapter,
  renderScene: RenderScene,
  options: HudTextOptions = {}
): RenderText {
  const node = renderAdapter.createText(options.text ?? "");
  node.x = options.x ?? 0;
  node.y = options.y ?? 0;

  if (options.fontSize !== undefined) {
    node.fontSize = options.fontSize;
  }

  if (options.visible !== undefined) {
    node.visible = options.visible;
  }

  renderScene.layers[options.layer ?? "ui"].addChild(node);
  return node;
}
