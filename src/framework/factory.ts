import type { RenderAdapter, RenderScene } from "../adapter/index.js";
import type { Entity, Scene } from "../core/index.js";
import type { AssetRegistry } from "./assets.js";

export type EntityFactoryContext = {
  assets?: AssetRegistry;
  scene: Scene;
  renderAdapter: RenderAdapter;
  renderScene: RenderScene;
};

export type EntityFactory<TOptions> = {
  create(context: EntityFactoryContext, options: TOptions): Entity;
};

export function defineEntityFactory<TOptions>(
  create: (context: EntityFactoryContext, options: TOptions) => Entity
): EntityFactory<TOptions> {
  return {
    create(context, options) {
      return create(context, options);
    }
  };
}
