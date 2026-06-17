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
    "docs/level-map.md",
    "docs/render-view-contract.md",
    "docs/runtime-ownership.md",
    "README.md",
    "LICENSE"
  ]);
});

test("product docs preserve engine-package instead of editor direction", async () => {
  const boundary = await readFile(new URL("../docs/product-boundary.md", import.meta.url), "utf8");
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.equal(boundary.includes("轻量 2D 游戏引擎依赖包"), true);
  assert.equal(boundary.includes("不在本仓库里实现编辑器本体"), true);
  assert.equal(boundary.includes("只读 runtime observability"), true);
  assert.equal(boundary.includes("创建、修改、保存、发布或管理内容资产"), true);
  assert.equal(roadmap.includes("只读 Runtime Observability 层"), true);
  assert.equal(roadmap.includes("不写回 scene、entity、component、asset、level、input binding 或项目文件"), true);
  assert.equal(readme.includes("一个可以被前端项目安装和接入的 2D 游戏引擎依赖包"), true);
  assert.equal(readme.includes("不承载编辑器本体、编辑器 UI、资源管理器或内容生产工作流"), true);
});

test("level map docs ship as package-facing non-editor guidance", async () => {
  const source = await readFile(new URL("../docs/level-map.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.equal(source.includes("frontend 2D game engine package"), true);
  assert.equal(source.includes("TileMap"), true);
  assert.equal(source.includes("LevelLayout"), true);
  assert.equal(source.includes("Scene config can optionally declare level/map data"), true);
  assert.equal(source.includes("not a visual tile map editor"), true);
  assert.equal(source.includes("Tooling should not mutate tile maps"), true);
  assert.equal(publicApi.includes("Level/Map Runtime Boundary"), true);
  assert.equal(readme.includes("docs/level-map.md"), true);
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

test("runtime hardening stage docs are discoverable from roadmap and package docs", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.17.0.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  for (const version of ["v0.17.1", "v0.17.2", "v0.17.3", "v0.17.4"]) {
    assert.equal(roadmap.includes(`version/${version}.md`), true, `roadmap should link ${version}`);
    assert.equal(stage.includes(`${version}.md`), true, `stage doc should link ${version}`);
  }

  assert.equal(stage.includes("The `0.17.x` stage is complete"), true);
  assert.equal(publicApi.includes("`0.17.x` closed runtime/game loop hardening"), true);
  assert.equal(publicApi.includes("Runtime Ownership Boundary"), true);
  assert.equal(readme.includes("`0.18.x` level/map runtime primitives 阶段都已经收口"), true);
});

test("level map stage docs are discoverable from roadmap and package docs", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.18.0.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  for (const version of ["v0.18.1", "v0.18.2", "v0.18.3", "v0.18.4", "v0.18.5"]) {
    assert.equal(roadmap.includes(`version/${version}.md`), true, `roadmap should link ${version}`);
    assert.equal(stage.includes(`${version}.md`), true, `stage doc should link ${version}`);
  }

  assert.equal(stage.includes("The `0.18.x` stage is complete"), true);
  assert.equal(publicApi.includes("`0.18.x` closed level/map runtime primitives"), true);
  assert.equal(publicApi.includes("Level/Map Runtime Boundary"), true);
  assert.equal(readme.includes("`0.18.x` level/map runtime primitives 阶段都已经收口"), true);
});

test("pointer input stage docs are discoverable from roadmap and package docs", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.19.0.md", import.meta.url), "utf8");
  const patch = await readFile(new URL("../docs/version/v0.19.1.md", import.meta.url), "utf8");
  const bridgePatch = await readFile(new URL("../docs/version/v0.19.2.md", import.meta.url), "utf8");
  const examplePatch = await readFile(new URL("../docs/version/v0.19.3.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  for (const version of ["v0.19.0", "v0.19.1", "v0.19.2", "v0.19.3"]) {
    assert.equal(roadmap.includes(`version/${version}.md`), true, `roadmap should link ${version}`);
  }

  assert.equal(stage.includes("Pointer/Input Runtime Primitives Sprint"), true);
  assert.equal(patch.includes("Pointer Button Action Binding Baseline"), true);
  assert.equal(stage.includes("v0.19.2.md"), true);
  assert.equal(bridgePatch.includes("Browser Pointer Button Bridge Baseline"), true);
  assert.equal(bridgePatch.includes("does not add pointer position tracking"), true);
  assert.equal(stage.includes("v0.19.3.md"), true);
  assert.equal(examplePatch.includes("Dodge Blocks Pointer Action Consumption"), true);
  assert.equal(examplePatch.includes("does not add pointer position tracking"), true);
  assert.equal(publicApi.includes("`0.19.x` starts pointer/input runtime primitives"), true);
  assert.equal(publicApi.includes("BrowserPointerButtonBridge"), true);
  assert.equal(readme.includes("`v0.19.3` Dodge Blocks Pointer Action Consumption"), true);
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
    "BrowserPointerButtonBridge",
    "CameraSystem",
    "CollisionSystem",
    "EventBus",
    "GameFlow",
    "InputActionMap",
    "InputSystem",
    "LevelLayout",
    "RuntimeScheduler",
    "RuntimeServices",
    "RuntimeServicesSystem",
    "SpriteAnimationComponent",
    "SpriteAnimationSystem",
    "StateMachine",
    "TileMap",
    "TransformComponent",
    "ViewComponent",
    "advanceSpriteAnimationPlayback",
    "addRuntimeServices",
    "bootstrapSceneFromConfig",
    "createLevelLayout",
    "createTileMap",
    "createSpriteAnimationPlayback",
    "createDefaultComponentSchemaRegistry",
    "createRuntimeServices",
    "defineLevelLayout",
    "defineTileMap",
    "defineKeyboardBinding",
    "definePointerButtonBinding",
    "defineSpriteAnimationClip",
    "defineSpriteFrame",
    "getPointerButtonInputId",
    "getSpriteAnimationPlaybackFrameId",
    "getSpriteAnimationPlaybackFrameIndex",
    "getRuntimeServices",
    "isSpriteCapableRenderNode",
    "loadAssetManifestAsync",
    "normalizeKeyboardKey",
    "normalizePointerButton",
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

test("dodge-blocks example consumes pointer button input through semantic actions", async () => {
  const boot = await readFile(new URL("boot.ts", dodgeBlocksExampleUrl), "utf8");
  const actions = await readFile(new URL("input-actions.ts", dodgeBlocksExampleUrl), "utf8");
  const docs = await readFile(new URL("README.md", dodgeBlocksExampleUrl), "utf8");

  assert.equal(boot.includes("BrowserPointerButtonBridge"), true);
  assert.equal(boot.includes("pointer.attach()"), true);
  assert.equal(boot.includes("pointer.detach()"), true);
  assert.equal(actions.includes("definePointerButtonBinding"), true);
  assert.equal(actions.includes('definePointerButtonBinding("primary")'), true);
  assert.equal(docs.includes("primary pointer button"), true);
  assert.equal(docs.includes("browser pointer bridge"), true);
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

test("dodge-blocks example consumes scene config level declarations", async () => {
  const source = await readFile(new URL("dodge-blocks-scene.ts", dodgeBlocksExampleUrl), "utf8");
  const docs = await readFile(new URL("README.md", dodgeBlocksExampleUrl), "utf8");

  assert.equal(source.includes("level: createDodgeBlocksLevelConfig"), true);
  assert.equal(source.includes("{ level: sceneConfig.level, entities: sceneConfig.entities }"), true);
  assert.equal(source.includes("getTile(DODGE_TILE_LAYER_ID, 0, 0)"), true);
  assert.equal(source.includes("getSpawnPoint(DODGE_PLAYER_SPAWN_ID)"), true);
  assert.equal(source.includes("getRegion(DODGE_PLAYFIELD_REGION_ID)"), true);
  assert.equal(source.includes("createDodgeLevelRuntime"), true);
  assert.equal(docs.includes("level.tileMap"), true);
  assert.equal(docs.includes("level.layout"), true);
  assert.equal(docs.includes("不会把 level/map 声明变成编辑器、地图渲染器或自动生成器"), true);
});

test("dodge-blocks docs frame tooling as read-only runtime observability", async () => {
  const source = await readFile(new URL("README.md", dodgeBlocksExampleUrl), "utf8");

  assert.equal(source.includes("Runtime Debug panel"), true);
  assert.equal(source.includes("system order"), true);
  assert.equal(source.includes("system lifecycle"), true);
  assert.equal(source.includes("不提供系统开关、组件改值、场景编辑或资产管理入口"), true);
});
