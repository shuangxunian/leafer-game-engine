import type { Entity } from "@shuangxunian/leafer-game-engine/core";
import {
  ColliderComponent,
  defineEntityFactory,
  SizeComponent,
  TransformComponent,
  VelocityComponent,
  ViewComponent
} from "@shuangxunian/leafer-game-engine/framework";
import type { EntityFactoryContext } from "@shuangxunian/leafer-game-engine/framework";

type HazardFactoryOptions = {
  canMove: () => boolean;
  name: string;
  size: number;
  speedY: number;
  x: number;
  y: number;
};

export const hazardFactory = defineEntityFactory<HazardFactoryOptions>(
  ({ assets, scene, renderAdapter, renderScene }: EntityFactoryContext, options): Entity => {
    const hazardNode = renderAdapter.createSprite("hazard");
    hazardNode.setAsset(assets?.getSprite("hazard") ?? "hazard");
    renderScene.layers.world.addChild(hazardNode);

    const hazard = scene.world.createEntity(options.name);
    const transform = hazard.addComponent(new TransformComponent());
    transform.x = options.x;
    transform.y = options.y;

    hazard.addComponent(new SizeComponent(options.size, options.size));
    hazard.addComponent(new ColliderComponent("hazard"));
    hazard.addComponent(new VelocityComponent(0, options.speedY, options.canMove));
    hazard.addComponent(new ViewComponent(hazardNode));

    return hazard;
  }
);
