import type { RenderAdapter, RenderScene, RenderSceneLayerName, RenderText } from "../adapter/index.js";

export type HudTextOptions = {
  text?: string;
  x?: number;
  y?: number;
  fontSize?: number;
  visible?: boolean;
  layer?: Extract<RenderSceneLayerName, "ui" | "overlay">;
};

export type HudTextBundleItem<TId extends string = string> = HudTextOptions & {
  id: TId;
};

export type HudTextBundle<TId extends string = string> = Readonly<{
  nodes: Readonly<Record<TId, RenderText>>;
  get(id: TId): RenderText;
  destroy(): void;
}>;

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

export function createHudTextBundle<const TItems extends readonly HudTextBundleItem[]>(
  renderAdapter: RenderAdapter,
  renderScene: RenderScene,
  items: TItems
): HudTextBundle<TItems[number]["id"]> {
  const seenIds = new Set<string>();

  for (const item of items) {
    if (seenIds.has(item.id)) {
      throw new Error(`Duplicate HUD text id "${item.id}".`);
    }
    seenIds.add(item.id);
  }

  const entries = items.map((item) => [item.id, createHudText(renderAdapter, renderScene, item)] as const);
  const nodes = Object.fromEntries(entries) as Record<TItems[number]["id"], RenderText>;

  return Object.freeze({
    nodes: Object.freeze({ ...nodes }),
    get: (id) => nodes[id],
    destroy: () => {
      for (const [, node] of entries) {
        node.destroy();
      }
    }
  });
}
