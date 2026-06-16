import test from "node:test";
import assert from "node:assert/strict";

import { AssetRegistry, loadAssetManifest } from "../lib/framework/index.js";

test("asset registry registers and resolves sprite assets", () => {
  const assets = new AssetRegistry();

  const player = assets.registerSprite({
    id: "player",
    fill: "#ffcf7a",
    width: 52,
    height: 52,
    cornerRadius: 14
  });

  assert.equal(player.type, "sprite");
  assert.equal(assets.hasSprite("player"), true);
  assert.deepEqual(assets.getSprite("player"), player);
  assert.deepEqual(assets.listSprites(), [player]);
});

test("asset registry keeps legacy source lookup compatibility", () => {
  const assets = new AssetRegistry();

  assets.register("hero", "/assets/hero.png");

  assert.equal(assets.get("hero"), "/assets/hero.png");
  assert.equal(assets.requireSprite("hero").source, "/assets/hero.png");
});

test("asset registry fails clearly for missing required sprites", () => {
  const assets = new AssetRegistry();

  assert.throws(() => assets.requireSprite("missing"), /Sprite asset "missing" is not registered/);
});

test("asset manifest registers sprite assets", () => {
  const assets = new AssetRegistry();

  const result = assets.loadManifest({
    sprites: [
      {
        id: "player",
        fill: "#ffcf7a",
        width: 52,
        height: 52,
        cornerRadius: 14
      },
      {
        id: "hazard",
        fill: "#6cb7ff",
        width: 32,
        height: 32
      }
    ]
  });

  assert.deepEqual(result, {
    ok: true,
    registeredSprites: ["player", "hazard"],
    errors: []
  });
  assert.equal(assets.requireSprite("player").fill, "#ffcf7a");
  assert.equal(assets.requireSprite("hazard").width, 32);
});

test("asset manifest helper can register into a registry", () => {
  const assets = new AssetRegistry();

  const result = loadAssetManifest(assets, {
    sprites: [{ id: "coin", source: "/assets/coin.png" }]
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.registeredSprites, ["coin"]);
  assert.equal(assets.get("coin"), "/assets/coin.png");
});

test("asset manifest reports invalid sprite ids without mutating registry", () => {
  const assets = new AssetRegistry();
  assets.registerSprite({ id: "existing", fill: "#ffffff" });

  const result = assets.loadManifest({
    sprites: [
      { id: "valid", fill: "#ffcf7a" },
      { id: "   ", fill: "#6cb7ff" },
      { fill: "#d95f5f" }
    ]
  });

  assert.deepEqual(result, {
    ok: false,
    registeredSprites: [],
    errors: [
      {
        assetId: "   ",
        code: "invalid-sprite-id",
        message: "Sprite asset id must be a non-empty string."
      },
      {
        assetId: undefined,
        code: "invalid-sprite-id",
        message: "Sprite asset id must be a non-empty string."
      }
    ]
  });
  assert.equal(assets.hasSprite("existing"), true);
  assert.equal(assets.hasSprite("valid"), false);
});

test("asset manifest reports duplicate sprite ids without mutating registry", () => {
  const assets = new AssetRegistry();

  const result = assets.loadManifest({
    sprites: [
      { id: "player", fill: "#ffcf7a" },
      { id: "player", fill: "#6cb7ff" }
    ]
  });

  assert.deepEqual(result, {
    ok: false,
    registeredSprites: [],
    errors: [
      {
        assetId: "player",
        code: "duplicate-sprite",
        message: 'Sprite asset "player" is declared more than once in the manifest.'
      }
    ]
  });
  assert.deepEqual(assets.listSprites(), []);
});
