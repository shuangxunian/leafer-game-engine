import test from "node:test";
import assert from "node:assert/strict";

import { Component, Game, Scene, System } from "../lib/core/index.js";
import { AssetRegistry } from "../lib/framework/index.js";
import {
  createDebugSnapshot,
  createSceneInspectorSnapshot,
  createToolingSnapshot,
  formatDebugSnapshot
} from "../lib/tooling/index.js";

class DebugSystem extends System {
  priority = 42;
}

class InspectorFixtureComponent extends Component {
  label = "hero";
  speed = 12;
  visible = true;
  empty = null;
  reference = { skip: true };
  callback = () => {};
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

test("debug snapshot formatting is stable and compact", () => {
  const scene = new Scene("FormatScene");
  const game = new Game();

  game.setScene(scene);
  game.tick(0.25);

  const lines = formatDebugSnapshot(
    createDebugSnapshot(scene, {
      game,
      renderScene: createFakeRenderScene()
    })
  );

  assert.deepEqual(lines.slice(0, 6), [
    "Scene FormatScene",
    "Entities 0/0",
    "Systems 0",
    "FPS 4",
    "DT 0.250s",
    "Viewport 800x600"
  ]);
});

test("scene inspector snapshot includes entity and component details", () => {
  const scene = new Scene("InspectorScene");
  const player = scene.world.createEntity("player");
  const component = player.addComponent(new InspectorFixtureComponent());
  component.enabled = false;
  const prop = scene.world.createEntity("prop");
  prop.active = false;

  const snapshot = createSceneInspectorSnapshot(scene);

  assert.equal(snapshot.sceneName, "InspectorScene");
  assert.equal(snapshot.entityCount, 2);
  assert.equal(snapshot.activeEntityCount, 1);
  assert.equal(snapshot.destroyedEntityCount, 0);
  assert.deepEqual(
    snapshot.entities.map((entity) => entity.name),
    ["player", "prop"]
  );

  assert.equal(snapshot.entities[0].id, player.id);
  assert.equal(snapshot.entities[0].active, true);
  assert.equal(snapshot.entities[0].destroyed, false);
  assert.equal(snapshot.entities[0].componentCount, 1);
  assert.deepEqual(snapshot.entities[1], {
    id: prop.id,
    name: "prop",
    active: false,
    destroyed: false,
    componentCount: 0,
    components: []
  });

  assert.deepEqual(snapshot.entities[0].components, [
    {
      name: "InspectorFixtureComponent",
      enabled: false,
      started: true,
      destroyed: false,
      data: {
        label: "hero",
        speed: 12,
        visible: true,
        empty: null
      }
    }
  ]);
});

test("tooling snapshot aggregates debug data and optional inspector data", () => {
  const game = new Game();
  const scene = new Scene("ToolingScene");
  const assets = new AssetRegistry();
  scene.world.createEntity("player");
  assets.registerSprite({ id: "player", fill: "#ffcf7a" });
  game.setScene(scene);
  game.tick(0.5);

  const debugOnly = createToolingSnapshot(scene, {
    assets,
    game,
    renderScene: createFakeRenderScene()
  });

  assert.equal(debugOnly.debug.sceneName, "ToolingScene");
  assert.equal(debugOnly.debug.time?.fps, 2);
  assert.deepEqual(debugOnly.debug.assets?.sprites, ["player"]);
  assert.equal(debugOnly.inspector, undefined);

  const withInspector = createToolingSnapshot(scene, { inspector: true });

  assert.equal(withInspector.debug.sceneName, "ToolingScene");
  assert.equal(withInspector.inspector?.sceneName, "ToolingScene");
  assert.deepEqual(
    withInspector.inspector?.entities.map((entity) => entity.name),
    ["player"]
  );
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
