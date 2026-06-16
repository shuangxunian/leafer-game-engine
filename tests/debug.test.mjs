import test from "node:test";
import assert from "node:assert/strict";

import { Game, Scene, System } from "../lib/core/index.js";
import { AssetRegistry } from "../lib/framework/index.js";
import { createDebugSnapshot } from "../lib/tooling/debug.js";

class DebugSystem extends System {
  priority = 42;
}

test("debug snapshot includes scene, entity and system details", () => {
  const scene = new Scene("DebugScene");
  scene.addSystem(new DebugSystem(scene));
  scene.world.createEntity("player");
  scene.start();

  const snapshot = createDebugSnapshot(scene);

  assert.equal(snapshot.sceneName, "DebugScene");
  assert.equal(snapshot.entityCount, 1);
  assert.equal(snapshot.activeEntityCount, 1);
  assert.equal(snapshot.destroyedEntityCount, 0);
  assert.equal(snapshot.systemCount, 1);
  assert.deepEqual(snapshot.systems, [
    {
      name: "DebugSystem",
      enabled: true,
      started: true,
      priority: 42
    }
  ]);
});

test("debug snapshot can include time, render and asset details", () => {
  const game = new Game();
  const scene = new Scene("RuntimeDebugScene");
  const assets = new AssetRegistry();
  assets.registerSprite({ id: "player", fill: "#ffcf7a" });

  game.setScene(scene);
  game.tick(0.5);

  const snapshot = createDebugSnapshot(scene, {
    assets,
    game,
    renderScene: createFakeRenderScene()
  });

  assert.equal(snapshot.time?.delta, 0.5);
  assert.equal(snapshot.time?.fps, 2);
  assert.equal(snapshot.render?.width, 800);
  assert.deepEqual(snapshot.render?.layers, ["background", "world", "ui", "overlay"]);
  assert.deepEqual(snapshot.assets?.sprites, ["player"]);
});

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
    x: 0,
    y: 0,
    width: undefined,
    height: undefined,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    addChild() {},
    destroy() {}
  };
}
