import test from "node:test";
import assert from "node:assert/strict";

import { Scene, System } from "../lib/core/index.js";
import {
  AssetRegistry,
  SizeComponent,
  TransformComponent,
  bootstrapSceneFromConfig,
  SceneSystemRegistry
} from "../lib/framework/index.js";

class MarkerSystem extends System {
  constructor(scene, label) {
    super(scene);
    this.label = label;
  }
}

test("scene config bootstraps assets, entities and systems", () => {
  const scene = new Scene("ConfiguredScene");
  const assets = new AssetRegistry();
  const systemRegistry = new SceneSystemRegistry().register("marker", (targetScene, data) => {
    if (!data || typeof data !== "object" || !("label" in data) || typeof data.label !== "string") {
      throw new Error("Invalid marker system data.");
    }

    return new MarkerSystem(targetScene, data.label);
  });

  const result = bootstrapSceneFromConfig(
    scene,
    {
      assets: {
        sprites: [{ id: "player", fill: "#ffcf7a" }]
      },
      entities: [
        {
          name: "Player",
          components: [
            { type: "transform", data: { x: 12, y: 34 } },
            { type: "size", data: { width: 52, height: 52 } }
          ]
        }
      ],
      systems: [{ type: "marker", data: { label: "runtime" } }]
    },
    {
      assets,
      systemRegistry
    }
  );

  assert.deepEqual(result.assets, {
    ok: true,
    registeredSprites: ["player"],
    errors: []
  });
  assert.equal(assets.requireSprite("player").fill, "#ffcf7a");
  assert.equal(result.entities.length, 1);
  assert.equal(result.entities[0].name, "Player");
  assert.equal(result.entities[0].getComponent(TransformComponent)?.x, 12);
  assert.equal(result.entities[0].getComponent(SizeComponent)?.width, 52);
  assert.equal(result.systems.length, 1);
  assert.equal(result.systems[0].label, "runtime");
  assert.equal(scene.systems.length, 1);
});

test("scene config stops before entity creation when asset manifest fails", () => {
  const scene = new Scene("InvalidAssetScene");
  const assets = new AssetRegistry();

  const result = bootstrapSceneFromConfig(
    scene,
    {
      assets: {
        sprites: [{ id: "   ", fill: "#ffcf7a" }]
      },
      entities: [
        {
          name: "ShouldNotExist",
          components: [{ type: "transform", data: { x: 1 } }]
        }
      ]
    },
    { assets }
  );

  assert.equal(result.assets?.ok, false);
  assert.deepEqual(result.entities, []);
  assert.deepEqual(result.systems, []);
  assert.deepEqual(scene.world.getEntities(), []);
});

test("scene config requires a system registry for system declarations", () => {
  const scene = new Scene("MissingSystemRegistryScene");

  assert.throws(
    () =>
      bootstrapSceneFromConfig(scene, {
        systems: [{ type: "marker" }]
      }),
    /Cannot bootstrap scene system "marker" without a SceneSystemRegistry/
  );
});

test("scene config fails clearly for unknown systems", () => {
  const scene = new Scene("UnknownSystemScene");
  const systemRegistry = new SceneSystemRegistry();

  assert.throws(
    () =>
      bootstrapSceneFromConfig(
        scene,
        {
          systems: [{ type: "missing" }]
        },
        { systemRegistry }
      ),
    /Unknown scene config system type "missing"/
  );
});
