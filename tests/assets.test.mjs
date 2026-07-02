import test from "node:test";
import assert from "node:assert/strict";

import {
  AssetRegistry,
  createBrowserImageSpriteLoader,
  loadAssetManifest,
  loadAssetManifestAsync
} from "../lib/framework/index.js";

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
  assert.deepEqual(assets.getSpriteLoadState("player"), {
    id: "player",
    status: "registered"
  });
});

test("asset registry keeps legacy source lookup compatibility", () => {
  const assets = new AssetRegistry();

  assets.register("hero", "/assets/hero.png");

  assert.equal(assets.get("hero"), "/assets/hero.png");
  assert.equal(assets.requireSprite("hero").source, "/assets/hero.png");
});

test("asset registry exposes copied render sprite assets for render handoff", () => {
  const assets = new AssetRegistry();
  assets.registerSprite({
    id: "hero",
    source: "/assets/hero.png",
    fill: "#ffcf7a",
    width: 48,
    height: 56,
    cornerRadius: 8
  });

  const renderAsset = assets.requireSpriteRenderAsset("hero");

  assert.deepEqual(renderAsset, {
    id: "hero",
    source: "/assets/hero.png",
    fill: "#ffcf7a",
    width: 48,
    height: 56,
    cornerRadius: 8
  });
  assert.equal("type" in renderAsset, false);

  renderAsset.source = "/mutated.png";
  assert.equal(assets.requireSprite("hero").source, "/assets/hero.png");
});

test("asset registry fails clearly for missing required sprites", () => {
  const assets = new AssetRegistry();

  assert.throws(() => assets.requireSprite("missing"), /Sprite asset "missing" is not registered/);
  assert.throws(() => assets.requireSpriteRenderAsset("missing"), /Sprite asset "missing" is not registered/);
});

test("asset registry loads registered sprites with an async loader", async () => {
  const assets = new AssetRegistry();
  assets.registerSprite({ id: "player", source: "/assets/player.png" });
  const loaded = [];

  const result = await assets.loadSprite("player", async (asset) => {
    loaded.push(asset.source);
  });

  assert.deepEqual(result, {
    id: "player",
    status: "loaded"
  });
  assert.deepEqual(loaded, ["/assets/player.png"]);
  assert.equal(assets.getSpriteLoadState("player")?.status, "loaded");
  assert.equal(typeof assets.getSpriteLoadState("player")?.loadedAt, "number");
});

test("asset registry skips sprites that are already loaded", async () => {
  const assets = new AssetRegistry();
  assets.registerSprite({ id: "player", source: "/assets/player.png" });
  let loadCount = 0;

  await assets.loadSprite("player", async () => {
    loadCount += 1;
  });
  const result = await assets.loadSprite("player", async () => {
    loadCount += 1;
  });

  assert.deepEqual(result, {
    id: "player",
    status: "skipped"
  });
  assert.equal(loadCount, 1);
  assert.equal(assets.getSpriteLoadState("player")?.status, "loaded");
});

test("asset registry records failed sprite loads", async () => {
  const assets = new AssetRegistry();
  assets.registerSprite({ id: "broken", source: "/assets/broken.png" });

  const result = await assets.loadSprite("broken", async () => {
    throw new Error("Network failed");
  });

  assert.deepEqual(result, {
    id: "broken",
    status: "failed",
    error: "Network failed"
  });
  assert.deepEqual(assets.getSpriteLoadState("broken"), {
    id: "broken",
    status: "failed",
    error: "Network failed"
  });
});

test("asset registry reports missing sprite loads without mutating load states", async () => {
  const assets = new AssetRegistry();

  const result = await assets.loadSprite("missing", async () => {});

  assert.deepEqual(result, {
    id: "missing",
    status: "failed",
    error: 'Sprite asset "missing" is not registered.'
  });
  assert.equal(assets.getSpriteLoadState("missing"), undefined);
  assert.deepEqual(assets.listSpriteLoadStates(), []);
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

test("asset manifest registers sprite frames and animation clips", () => {
  const assets = new AssetRegistry();

  const result = assets.loadManifest({
    sprites: [{ id: "hero", source: "/assets/hero.png" }],
    frames: [
      { id: "hero-idle-1", spriteId: "hero", x: 0, y: 0, width: 32, height: 32, durationSeconds: 0.12 },
      { id: "hero-idle-2", spriteId: "hero", x: 32, y: 0, width: 32, height: 32 }
    ],
    clips: [
      {
        id: "hero-idle",
        frameIds: ["hero-idle-1", "hero-idle-2"],
        frameDurationSeconds: 0.1,
        loop: true
      }
    ]
  });

  assert.deepEqual(result, {
    ok: true,
    registeredSprites: ["hero"],
    errors: []
  });
  assert.deepEqual(assets.requireSpriteFrame("hero-idle-1"), {
    id: "hero-idle-1",
    spriteId: "hero",
    x: 0,
    y: 0,
    width: 32,
    height: 32,
    durationSeconds: 0.12
  });
  assert.deepEqual(assets.requireAnimationClip("hero-idle"), {
    id: "hero-idle",
    frameIds: ["hero-idle-1", "hero-idle-2"],
    frameDurationSeconds: 0.1,
    loop: true
  });
});

test("asset manifest validates sprite frame and animation clip references before mutating registry", () => {
  const assets = new AssetRegistry();
  assets.registerSprite({ id: "existing", source: "/assets/existing.png" });

  const result = assets.loadManifest({
    frames: [
      { id: "valid-frame", spriteId: "existing" },
      { id: "missing-sprite-frame", spriteId: "missing" },
      { id: "bad-duration", spriteId: "existing", durationSeconds: 0 }
    ],
    clips: [
      { id: "valid-clip", frameIds: ["valid-frame"] },
      { id: "missing-frame-clip", frameIds: ["missing-frame"] },
      { id: "empty-clip", frameIds: [] },
      { id: "bad-duration-clip", frameIds: ["valid-frame"], frameDurationSeconds: 0 }
    ]
  });

  assert.deepEqual(result, {
    ok: false,
    registeredSprites: [],
    errors: [
      {
        assetId: "missing-sprite-frame",
        code: "invalid-sprite-frame-sprite",
        message: 'Sprite frame "missing-sprite-frame" must reference a registered sprite asset.'
      },
      {
        assetId: "bad-duration",
        code: "invalid-sprite-frame-duration",
        message: 'Sprite frame "bad-duration" durationSeconds must be greater than 0.'
      },
      {
        assetId: "missing-frame-clip",
        code: "invalid-animation-clip-frame",
        message: 'Sprite animation clip "missing-frame-clip" references missing frame "missing-frame".'
      },
      {
        assetId: "empty-clip",
        code: "invalid-animation-clip-frames",
        message: 'Sprite animation clip "empty-clip" must include at least one frame id.'
      },
      {
        assetId: "bad-duration-clip",
        code: "invalid-animation-clip-frame-duration",
        message: 'Sprite animation clip "bad-duration-clip" frameDurationSeconds must be greater than 0.'
      }
    ]
  });
  assert.deepEqual(assets.listSpriteFrames(), []);
  assert.deepEqual(assets.listAnimationClips(), []);
});

test("async asset manifest loading registers and loads sprites", async () => {
  const assets = new AssetRegistry();
  const loaded = [];

  const result = await assets.loadManifestAsync(
    {
      sprites: [
        { id: "player", source: "/assets/player.png" },
        { id: "hazard", source: "/assets/hazard.png" }
      ]
    },
    async (asset) => {
      loaded.push(asset.id);
    }
  );

  assert.deepEqual(result, {
    ok: true,
    registeredSprites: ["player", "hazard"],
    loadedSprites: ["player", "hazard"],
    failedSprites: [],
    skippedSprites: [],
    errors: [],
    loadResults: [
      { id: "player", status: "loaded" },
      { id: "hazard", status: "loaded" }
    ]
  });
  assert.deepEqual(loaded, ["player", "hazard"]);
  assert.equal(assets.getSpriteLoadState("player")?.status, "loaded");
  assert.equal(assets.getSpriteLoadState("hazard")?.status, "loaded");
});

test("async asset manifest loading reports partial failures", async () => {
  const assets = new AssetRegistry();

  const result = await assets.loadManifestAsync(
    {
      sprites: [
        { id: "player", source: "/assets/player.png" },
        { id: "broken", source: "/assets/broken.png" },
        { id: "hazard", source: "/assets/hazard.png" }
      ]
    },
    async (asset) => {
      if (asset.id === "broken") {
        throw new Error("Broken image");
      }
    }
  );

  assert.deepEqual(result, {
    ok: false,
    registeredSprites: ["player", "broken", "hazard"],
    loadedSprites: ["player", "hazard"],
    failedSprites: ["broken"],
    skippedSprites: [],
    errors: [],
    loadResults: [
      { id: "player", status: "loaded" },
      { id: "broken", status: "failed", error: "Broken image" },
      { id: "hazard", status: "loaded" }
    ]
  });
  assert.equal(assets.getSpriteLoadState("broken")?.status, "failed");
  assert.equal(assets.getSpriteLoadState("hazard")?.status, "loaded");
});

test("async asset manifest loading can report skipped sprites", async () => {
  const assets = new AssetRegistry();
  assets.registerSprite({ id: "player", source: "/assets/player.png" });
  await assets.loadSprite("player", async () => {});

  const result = await assets.loadManifestAsync(
    {
      sprites: [
        { id: "player", source: "/assets/player.png" },
        { id: "coin", source: "/assets/coin.png" }
      ]
    },
    async () => {}
  );

  assert.deepEqual(result, {
    ok: true,
    registeredSprites: ["player", "coin"],
    loadedSprites: ["coin"],
    failedSprites: [],
    skippedSprites: ["player"],
    errors: [],
    loadResults: [
      { id: "player", status: "skipped" },
      { id: "coin", status: "loaded" }
    ]
  });
});

test("async asset manifest loading reports validation errors without registering or loading", async () => {
  const assets = new AssetRegistry();
  const loaded = [];

  const result = await assets.loadManifestAsync(
    {
      sprites: [
        { id: "valid", source: "/assets/valid.png" },
        { id: "", source: "/assets/broken.png" }
      ]
    },
    async (asset) => {
      loaded.push(asset.id);
    }
  );

  assert.deepEqual(result, {
    ok: false,
    registeredSprites: [],
    loadedSprites: [],
    failedSprites: [],
    skippedSprites: [],
    errors: [
      {
        assetId: "",
        code: "invalid-sprite-id",
        message: "Sprite asset id must be a non-empty string."
      }
    ],
    loadResults: []
  });
  assert.deepEqual(loaded, []);
  assert.equal(assets.hasSprite("valid"), false);
});

test("async asset manifest helper can load into a registry", async () => {
  const assets = new AssetRegistry();

  const result = await loadAssetManifestAsync(
    assets,
    {
      sprites: [{ id: "coin", source: "/assets/coin.png" }]
    },
    async () => {}
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.loadedSprites, ["coin"]);
  assert.equal(assets.getSpriteLoadState("coin")?.status, "loaded");
});

test("browser image sprite loader resolves when an image loads", async () => {
  const image = createFakeImage();
  const loader = createBrowserImageSpriteLoader({
    crossOrigin: "anonymous",
    imageFactory: () => image
  });

  await loader({
    id: "player",
    type: "sprite",
    source: "/assets/player.png"
  });

  assert.equal(image.src, "/assets/player.png");
  assert.equal(image.crossOrigin, "anonymous");
  assert.equal(image.onload, null);
  assert.equal(image.onerror, null);
});

test("browser image sprite loader rejects sprites without sources", async () => {
  const loader = createBrowserImageSpriteLoader({
    imageFactory: () => createFakeImage()
  });

  await assert.rejects(
    loader({
      id: "shape",
      type: "sprite",
      fill: "#ffcf7a"
    }),
    /Sprite asset "shape" must define a source/
  );
});

test("browser image sprite loader rejects image load errors", async () => {
  const image = createFakeImage({ fail: true, error: new Error("404") });
  const loader = createBrowserImageSpriteLoader({
    imageFactory: () => image
  });

  await assert.rejects(
    loader({
      id: "broken",
      type: "sprite",
      source: "/assets/broken.png"
    }),
    /Failed to load sprite asset "broken" from "\/assets\/broken.png"\. 404/
  );
  assert.equal(image.onload, null);
  assert.equal(image.onerror, null);
});

test("browser image sprite loader integrates with asset registry load state", async () => {
  const assets = new AssetRegistry();
  const image = createFakeImage();
  assets.registerSprite({ id: "coin", source: "/assets/coin.png" });

  const result = await assets.loadSprite(
    "coin",
    createBrowserImageSpriteLoader({
      imageFactory: () => image
    })
  );

  assert.deepEqual(result, {
    id: "coin",
    status: "loaded"
  });
  assert.equal(image.src, "/assets/coin.png");
  assert.equal(assets.getSpriteLoadState("coin")?.status, "loaded");
});

function createFakeImage(options = {}) {
  const image = {
    crossOrigin: null,
    onload: null,
    onerror: null,
    src: ""
  };

  Object.defineProperty(image, "src", {
    get() {
      return this.assignedSrc ?? "";
    },
    set(value) {
      this.assignedSrc = value;
      queueMicrotask(() => {
        if (options.fail) {
          this.onerror?.(options.error);
          return;
        }

        this.onload?.();
      });
    }
  });

  return image;
}
