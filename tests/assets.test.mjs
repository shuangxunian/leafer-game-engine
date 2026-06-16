import test from "node:test";
import assert from "node:assert/strict";

import { AssetRegistry } from "../lib/framework/index.js";

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
