import test from "node:test";
import assert from "node:assert/strict";

import { Scene } from "../lib/core/index.js";
import { ColliderComponent, SizeComponent, TransformComponent } from "../lib/framework/index.js";
import { ColliderDebugSystem } from "../lib/tooling/index.js";

test("collider debug system creates and syncs world-layer debug nodes", () => {
  const scene = new Scene("ColliderDebugScene");
  const renderAdapter = createFakeRenderAdapter();
  const renderScene = createFakeRenderScene();
  scene.addSystem(new ColliderDebugSystem(scene, renderAdapter, renderScene));

  const entity = scene.world.createEntity("box");
  const transform = entity.addComponent(new TransformComponent());
  transform.x = 20;
  transform.y = 30;
  entity.addComponent(new SizeComponent(40, 50));
  entity.addComponent(new ColliderComponent("debug", undefined, undefined, 2, 3));

  scene.start();
  scene.lateUpdate(1 / 60);

  assert.equal(renderScene.layers.world.children.length, 1);
  const node = renderScene.layers.world.children[0];
  assert.equal(node.x, 22);
  assert.equal(node.y, 33);
  assert.equal(node.width, 40);
  assert.equal(node.height, 50);
  assert.equal(node.asset.id, "debug-collider");
});

test("collider debug system destroys nodes for removed entities", () => {
  const scene = new Scene("ColliderDebugCleanupScene");
  const renderAdapter = createFakeRenderAdapter();
  const renderScene = createFakeRenderScene();
  scene.addSystem(new ColliderDebugSystem(scene, renderAdapter, renderScene));

  const entity = scene.world.createEntity("box");
  entity.addComponent(new TransformComponent());
  entity.addComponent(new SizeComponent(20, 20));
  entity.addComponent(new ColliderComponent("debug"));

  scene.start();
  scene.lateUpdate(1 / 60);
  const node = renderScene.layers.world.children[0];

  scene.world.destroyEntity(entity);
  scene.lateUpdate(1 / 60);

  assert.equal(node.destroyed, true);
});

function createFakeRenderAdapter() {
  return {
    createScene() {
      return createFakeRenderScene();
    },
    createContainer() {
      return createFakeContainer();
    },
    createSprite(assetId = "") {
      const node = createFakeNode();
      node.asset = assetId;
      return {
        ...node,
        setAsset(asset) {
          this.asset = asset;
        }
      };
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
    children: [],
    addChild(node) {
      this.children.push(node);
    }
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
    destroyed: false,
    destroy() {
      this.destroyed = true;
    }
  };
}
