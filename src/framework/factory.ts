import type { RenderAdapter, RenderScene } from "../adapter/index.js";
import type { Entity, Scene } from "../core/index.js";

export type EntityFactoryContext = {
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
