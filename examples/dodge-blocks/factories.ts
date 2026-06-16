import type { Entity } from "../../src/core/index.js";
import {
  ColliderComponent,
  defineEntityFactory,
  SizeComponent,
  TransformComponent,
  VelocityComponent,
  ViewComponent
} from "../../src/framework/index.js";
import type { EntityFactoryContext } from "../../src/framework/index.js";
import { PlayerControllerComponent } from "./player-controller.js";

type PlayerFactoryOptions = {
  canMove: () => boolean;
  height: number;
  padding: number;
  playerSize: number;
  speed: number;
  width: number;
  x: number;
  y: number;
};

type HazardFactoryOptions = {
  canMove: () => boolean;
  name: string;
  size: number;
  speedY: number;
  x: number;
  y: number;
};

export const playerFactory = defineEntityFactory<PlayerFactoryOptions>(
  ({ assets, scene, renderAdapter, renderScene }: EntityFactoryContext, options): Entity => {
    const playerNode = renderAdapter.createSprite("player");
    playerNode.setAsset(assets?.getSprite("player") ?? "player");
    renderScene.layers.world.addChild(playerNode);

    const player = scene.world.createEntity("Player");
    const transform = player.addComponent(new TransformComponent());
    transform.x = options.x;
    transform.y = options.y;

    player.addComponent(new SizeComponent(options.playerSize, options.playerSize));
    player.addComponent(new ColliderComponent("player"));
    player.addComponent(
      new PlayerControllerComponent(
        options.speed,
        {
          width: options.width,
          height: options.height,
          padding: options.padding
        },
        options.canMove
      )
    );
    player.addComponent(new ViewComponent(playerNode));

    return player;
  }
);

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
