import test from "node:test";
import assert from "node:assert/strict";

import { Scene } from "../lib/core/index.js";
import { defineEntityFactory, TransformComponent } from "../lib/framework/index.js";

test("entity factory creates entities from shared context", () => {
  const factory = defineEntityFactory(({ scene }, options) => {
    const entity = scene.world.createEntity(options.name);
    const transform = entity.addComponent(new TransformComponent());
    transform.x = options.x;
    transform.y = options.y;
    return entity;
  });

  const scene = new Scene("FactoryScene");
  const entity = factory.create(
    {
      scene,
      renderAdapter: createFakeRenderAdapter(),
      renderScene: createFakeRenderScene()
    },
    {
      name: "Spawned",
      x: 12,
      y: 34
    }
  );

  assert.equal(entity.name, "Spawned");
  assert.equal(entity.getComponent(TransformComponent)?.x, 12);
  assert.equal(entity.getComponent(TransformComponent)?.y, 34);
});

function createFakeRenderAdapter() {
  return {
    createScene() {
      return createFakeRenderScene();
    },
    createContainer() {
      return createFakeContainer();
    },
    createSprite() {
      return createFakeNode();
    },
    createText() {
      return {
        ...createFakeNode(),
        fontSize: 0,
        setText() {}
      };
    }
  };
}

function createFakeRenderScene() {
  return {
    root: createFakeContainer(),
    layers: {
      background: createFakeContainer(),
      world: createFakeContainer(),
      ui: createFakeContainer(),
      overlay: createFakeContainer()
    },
    width: 800,
    height: 600,
    mount() {},
    destroy() {}
  };
}

function createFakeContainer() {
  return {
    ...createFakeNode(),
    addChild() {}
  };
}

function createFakeNode() {
  return {
    x: 0,
    y: 0,
    width: undefined,
    height: undefined,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    destroy() {}
  };
}
