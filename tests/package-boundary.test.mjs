import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
);
const dodgeBlocksExampleUrl = new URL("../examples/dodge-blocks/", import.meta.url);

function assertExports(moduleExports, names) {
  for (const name of names) {
    assert.equal(name in moduleExports, true, `Expected public export "${name}"`);
  }
}

async function listFiles(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryUrl = new URL(entry.name, directoryUrl);
    if (entry.isDirectory()) {
      files.push(...await listFiles(new URL(`${entry.name}/`, directoryUrl)));
      continue;
    }

    files.push(entryUrl);
  }

  return files;
}

test("package export map exposes the documented public entrypoints", () => {
  assert.deepEqual(Object.keys(packageJson.exports), [
    ".",
    "./adapter",
    "./adapter/render-types",
    "./core",
    "./framework",
    "./runtime",
    "./tooling"
  ]);

  for (const [entrypoint, config] of Object.entries(packageJson.exports)) {
    assert.equal(typeof config.import, "string", `${entrypoint} should define an import target`);
    assert.equal(typeof config.types, "string", `${entrypoint} should define a types target`);
    assert.equal(config.import.startsWith("./lib/"), true, `${entrypoint} should import from lib`);
    assert.equal(config.types.startsWith("./lib/"), true, `${entrypoint} should expose lib types`);
  }
});

test("package publish files include library output and docs", () => {
  assert.deepEqual(packageJson.files, [
    "lib",
    "docs/public-api.md",
    "docs/product-boundary.md",
    "docs/animation-runtime.md",
    "docs/runtime-services.md",
    "docs/input-actions.md",
    "docs/runtime-observability.md",
    "docs/scene-config.md",
    "docs/render-view-contract.md",
    "docs/runtime-ownership.md",
    "README.md",
    "LICENSE"
  ]);
});

test("runtime ownership docs ship as package-facing non-editor guidance", async () => {
  const source = await readFile(new URL("../docs/runtime-ownership.md", import.meta.url), "utf8");

  assert.equal(source.includes("frontend 2D game engine package contract"), true);
  assert.equal(source.includes("runtime.stop()"), true);
  assert.equal(source.includes("does not destroy the active scene"), true);
  assert.equal(source.includes("does not destroy the mounted render scene"), true);
  assert.equal(source.includes("## Tooling Ownership"), true);
  assert.equal(source.includes("read-only runtime observability helpers"), true);
  assert.equal(source.includes("not scene editing, component editing, asset management, or content authoring"), true);
});

test("core package subpath can be imported by package name in Node", async () => {
  const core = await import(`${packageJson.name}/core`);

  assertExports(core, ["Component", "Entity", "Game", "Scene", "System", "Time", "World"]);
});

test("adapter render-types subpath exposes Node-safe render layer contract helpers", async () => {
  const renderTypes = await import(`${packageJson.name}/adapter/render-types`);

  assertExports(renderTypes, ["RENDER_SCENE_LAYER_ORDER", "getRenderSceneLayerNames"]);
  assert.deepEqual(renderTypes.RENDER_SCENE_LAYER_ORDER, ["background", "world", "ui", "overlay"]);
});

test("framework package subpath can be imported by package name in Node", async () => {
  const framework = await import(`${packageJson.name}/framework`);

  assertExports(framework, [
    "AssetRegistry",
    "CameraSystem",
    "CollisionSystem",
    "EventBus",
    "GameFlow",
    "InputActionMap",
    "InputSystem",
    "RuntimeScheduler",
    "RuntimeServices",
    "RuntimeServicesSystem",
    "SpriteAnimationComponent",
    "SpriteAnimationSystem",
    "StateMachine",
    "TransformComponent",
    "ViewComponent",
    "advanceSpriteAnimationPlayback",
    "addRuntimeServices",
    "bootstrapSceneFromConfig",
    "createSpriteAnimationPlayback",
    "createDefaultComponentSchemaRegistry",
    "createRuntimeServices",
    "defineKeyboardBinding",
    "defineSpriteAnimationClip",
    "defineSpriteFrame",
    "getSpriteAnimationPlaybackFrameId",
    "getSpriteAnimationPlaybackFrameIndex",
    "getRuntimeServices",
    "isSpriteCapableRenderNode",
    "loadAssetManifestAsync",
    "normalizeKeyboardKey",
    "validateSceneConfig"
  ]);
});

test("tooling package subpath can be imported by package name in Node", async () => {
  const tooling = await import(`${packageJson.name}/tooling`);

  assertExports(tooling, [
    "createDebugSnapshot",
    "createInputActionSnapshot",
    "createInputActionsPanelSection",
    "createRuntimeServicesPanelSection",
    "createRuntimeServicesSnapshot",
    "createSpriteAnimationSnapshot",
    "createSpriteAnimationsPanelSection",
    "createToolingSnapshot",
    "createToolingPanelSections",
    "formatDebugSnapshot",
    "formatInputActionSnapshot",
    "formatRuntimeServicesSnapshot",
    "formatSpriteAnimationSnapshot",
    "formatToolingSnapshot"
  ]);
});

test("dodge-blocks example imports engine APIs through package-style entrypoints", async () => {
  const files = (await listFiles(dodgeBlocksExampleUrl))
    .filter((fileUrl) => fileUrl.pathname.endsWith(".ts"));

  for (const fileUrl of files) {
    const source = await readFile(fileUrl, "utf8");
    assert.equal(source.includes("../../src/"), false, `${fileUrl.pathname} should not import engine APIs from src`);
  }
});

test("dodge-blocks gameplay consumes input action mappings instead of direct physical key queries", async () => {
  const gameplayFiles = [
    "dodge-game-system.ts",
    "player-controller.ts"
  ];

  for (const file of gameplayFiles) {
    const source = await readFile(new URL(file, dodgeBlocksExampleUrl), "utf8");
    assert.equal(source.includes("InputActionMap"), true, `${file} should consume semantic input actions`);
    assert.equal(source.includes("isPressed(\""), false, `${file} should not query raw physical pressed keys`);
    assert.equal(source.includes("wasPressed(\""), false, `${file} should not query raw physical just-pressed keys`);
  }
});

test("dodge-blocks example passes runtime debug context into tooling snapshots", async () => {
  const source = await readFile(new URL("boot.ts", dodgeBlocksExampleUrl), "utf8");

  assert.equal(source.includes("createToolingSnapshot(scene"), true);
  assert.equal(source.includes("game: runtime.game"), true, "boot should pass Game time state into tooling snapshots");
  assert.equal(source.includes("renderScene: runtime.renderScene"), true, "boot should pass viewport state into tooling snapshots");
});

test("dodge-blocks example consumes scene config bootstrap APIs", async () => {
  const source = await readFile(new URL("dodge-blocks-scene.ts", dodgeBlocksExampleUrl), "utf8");

  assert.equal(source.includes("createDodgeBlocksSceneConfig"), true);
  assert.equal(source.includes("bootstrapSceneFromConfig"), true);
  assert.equal(source.includes("validateBeforeBootstrap: true"), true);
  assert.equal(source.includes("sceneConfig.assets"), true);
  assert.equal(source.includes("instantiateEntityTemplate"), false, "example should bootstrap static player data from scene config");
});

test("dodge-blocks docs frame tooling as read-only runtime observability", async () => {
  const source = await readFile(new URL("README.md", dodgeBlocksExampleUrl), "utf8");

  assert.equal(source.includes("Runtime Debug panel"), true);
  assert.equal(source.includes("system order"), true);
  assert.equal(source.includes("system lifecycle"), true);
  assert.equal(source.includes("不提供系统开关、组件改值、场景编辑或资产管理入口"), true);
});
