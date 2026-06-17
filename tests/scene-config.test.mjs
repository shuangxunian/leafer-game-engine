import test from "node:test";
import assert from "node:assert/strict";

import { Scene, System } from "../lib/core/index.js";
import {
  AssetRegistry,
  SizeComponent,
  TransformComponent,
  bootstrapSceneFromConfig,
  SceneSystemRegistry,
  validateSceneConfig
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

test("scene config validation accepts valid configs without mutating runtime state", () => {
  const scene = new Scene("ValidationNoMutationScene");
  const assets = new AssetRegistry();
  const systemRegistry = new SceneSystemRegistry().register("marker", (targetScene, data) => new MarkerSystem(targetScene, data?.label));

  const result = validateSceneConfig(
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

  assert.deepEqual(result, {
    ok: true,
    errors: []
  });
  assert.deepEqual(scene.world.getEntities(), []);
  assert.deepEqual(scene.systems, []);
  assert.deepEqual(assets.listSprites(), []);
});

test("scene config validation reports structural errors deterministically", () => {
  assert.deepEqual(validateSceneConfig({
    assets: {
      sprites: "not-array",
      frames: "not-array",
      clips: "not-array"
    },
    entities: [
      {
        name: 123,
        components: "not-array"
      },
      null
    ],
    systems: [
      null,
      { type: "   " }
    ]
  }).errors, [
    {
      code: "invalid-assets",
      path: "assets.sprites",
      message: "Scene config assets.sprites must be an array."
    },
    {
      code: "invalid-assets",
      path: "assets.frames",
      message: "Scene config assets.frames must be an array."
    },
    {
      code: "invalid-assets",
      path: "assets.clips",
      message: "Scene config assets.clips must be an array."
    },
    {
      code: "invalid-entity",
      path: "entities[0].name",
      message: "Scene config entity name must be a string when provided."
    },
    {
      code: "invalid-components",
      path: "entities[0].components",
      message: "Scene config entity components must be an array."
    },
    {
      code: "invalid-entity",
      path: "entities[1]",
      message: "Scene config entity must be an object."
    },
    {
      code: "invalid-system",
      path: "systems[0]",
      message: "Scene config system must be an object."
    },
    {
      code: "invalid-system",
      path: "systems[1].type",
      message: "Scene config system type must be a non-empty string."
    }
  ]);
});

test("scene config validation reports asset manifest errors without mutating asset registry", () => {
  const assets = new AssetRegistry();
  assets.registerSprite({ id: "existing", fill: "#ffffff" });

  const result = validateSceneConfig(
    {
      assets: {
        sprites: [
          { id: "valid", fill: "#ffcf7a" },
          { id: "   ", fill: "#6cb7ff" }
        ]
      }
    },
    { assets }
  );

  assert.deepEqual(result, {
    ok: false,
    errors: [
      {
        code: "invalid-asset-manifest",
        path: "assets:   ",
        message: "Sprite asset id must be a non-empty string."
      }
    ]
  });
  assert.deepEqual(assets.listSprites().map((sprite) => sprite.id), ["existing"]);
});

test("scene config validation reports unknown components and systems", () => {
  const systemRegistry = new SceneSystemRegistry();

  assert.deepEqual(validateSceneConfig(
    {
      entities: [
        {
          components: [{ type: "missing" }]
        }
      ],
      systems: [{ type: "missing" }]
    },
    { systemRegistry }
  ), {
    ok: false,
    errors: [
      {
        code: "unknown-component",
        path: "entities[0].components[0].type",
        message: 'Unknown entity template component type "missing".'
      },
      {
        code: "unknown-system",
        path: "systems[0].type",
        message: 'Unknown scene config system type "missing".'
      }
    ]
  });
});

test("scene config validation requires a system registry for system declarations", () => {
  assert.deepEqual(validateSceneConfig({
    systems: [{ type: "marker" }]
  }), {
    ok: false,
    errors: [
      {
        code: "missing-system-registry",
        path: "systems[0].type",
        message: 'Cannot validate scene system "marker" without a SceneSystemRegistry.'
      }
    ]
  });
});

test("scene config validation reports invalid component data as diagnostics", () => {
  assert.deepEqual(validateSceneConfig({
    entities: [
      {
        components: [
          { type: "size", data: { width: "wide", height: 52 } }
        ]
      }
    ]
  }), {
    ok: false,
    errors: [
      {
        code: "invalid-component-data",
        path: "entities[0].components[0].data",
        message: 'Invalid entity template data for "size.width": expected number.'
      }
    ]
  });
});

test("scene config safe bootstrap returns validation diagnostics before runtime mutation", () => {
  const scene = new Scene("SafeBootstrapInvalidScene");
  const assets = new AssetRegistry();
  const systemRegistry = new SceneSystemRegistry().register("marker", (targetScene, data) => new MarkerSystem(targetScene, data?.label));

  const result = bootstrapSceneFromConfig(
    scene,
    {
      assets: {
        sprites: [{ id: "player", fill: "#ffcf7a" }]
      },
      entities: [
        {
          name: "InvalidPlayer",
          components: [{ type: "size", data: { width: "wide", height: 52 } }]
        }
      ],
      systems: [{ type: "marker", data: { label: "runtime" } }]
    },
    {
      assets,
      systemRegistry,
      validateBeforeBootstrap: true
    }
  );

  assert.deepEqual(result, {
    validation: {
      ok: false,
      errors: [
        {
          code: "invalid-component-data",
          path: "entities[0].components[0].data",
          message: 'Invalid entity template data for "size.width": expected number.'
        }
      ]
    },
    entities: [],
    systems: []
  });
  assert.deepEqual(scene.world.getEntities(), []);
  assert.deepEqual(scene.systems, []);
  assert.deepEqual(assets.listSprites(), []);
});

test("scene config safe bootstrap includes successful validation result", () => {
  const scene = new Scene("SafeBootstrapValidScene");
  const assets = new AssetRegistry();
  const systemRegistry = new SceneSystemRegistry().register("marker", (targetScene, data) => new MarkerSystem(targetScene, data?.label));

  const result = bootstrapSceneFromConfig(
    scene,
    {
      assets: {
        sprites: [{ id: "player", fill: "#ffcf7a" }]
      },
      entities: [
        {
          name: "Player",
          components: [{ type: "transform", data: { x: 12, y: 34 } }]
        }
      ],
      systems: [{ type: "marker", data: { label: "runtime" } }]
    },
    {
      assets,
      systemRegistry,
      validateBeforeBootstrap: true
    }
  );

  assert.deepEqual(result.validation, {
    ok: true,
    errors: []
  });
  assert.equal(result.assets?.ok, true);
  assert.equal(result.entities.length, 1);
  assert.equal(result.entities[0].name, "Player");
  assert.equal(result.systems.length, 1);
  assert.equal(assets.requireSprite("player").fill, "#ffcf7a");
  assert.equal(scene.world.getEntities().length, 1);
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
