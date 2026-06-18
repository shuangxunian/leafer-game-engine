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
  assert.equal(boundary.includes("当前项目继续按“前端游戏引擎依赖包”推进"), true);
  assert.equal(boundary.includes("编辑器不是当前仓库的产品方向"), true);
  assert.equal(boundary.includes("不能表示这些产品会在本仓库内实现"), true);
  assert.equal(boundary.includes("只读 runtime diagnostics"), true);
  assert.equal(boundary.includes("创建、修改、保存、发布或管理内容资产"), true);
  assert.equal(boundary.includes("版本评审规则"), true);
  assert.equal(boundary.includes("这是不是一个可以被前端游戏项目通过 package API 消费的运行时/框架能力"), true);
  assert.equal(boundary.includes("不允许把“未来编辑器可能需要”当成本仓库实现编辑器 UI 的理由"), true);
  assert.equal(roadmap.includes("只读 Runtime Observability 层"), true);
  assert.equal(roadmap.includes("数据驱动与运行时诊断基础"), true);
  assert.equal(roadmap.includes("未来外部上层产品（非当前仓库目标）"), true);
  assert.equal(roadmap.includes("这类项目不是当前仓库的直接目标用户，只是潜在的下游消费者"), true);
  assert.equal(roadmap.includes("当前仓库交付的是依赖包，不交付编辑器应用"), true);
  assert.equal(roadmap.includes("不写回 scene、entity、component、asset、level、input binding 或项目文件"), true);
  assert.equal(roadmap.includes("不代表当前仓库要进入编辑器、资源管理器、关卡制作器或内容发布系统"), true);
  assert.equal(readme.includes("一个可以被前端项目安装和接入的 2D 游戏引擎依赖包"), true);
  assert.equal(readme.includes("不承载编辑器本体、编辑器 UI、资源管理器或内容生产工作流"), true);
  assert.equal(readme.includes("后续版本评审时也按这个规则执行"), true);
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
  assert.equal(readme.includes("`0.17.x` runtime/game loop hardening 阶段"), true);
  assert.equal(readme.includes("都已经收口"), true);
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
  assert.equal(readme.includes("`0.18.x` level/map runtime primitives 阶段"), true);
  assert.equal(readme.includes("都已经收口"), true);
});

test("pointer input stage docs are discoverable from roadmap and package docs", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.19.0.md", import.meta.url), "utf8");
  const patch = await readFile(new URL("../docs/version/v0.19.1.md", import.meta.url), "utf8");
  const bridgePatch = await readFile(new URL("../docs/version/v0.19.2.md", import.meta.url), "utf8");
  const examplePatch = await readFile(new URL("../docs/version/v0.19.3.md", import.meta.url), "utf8");
  const closeoutPatch = await readFile(new URL("../docs/version/v0.19.4.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const inputDocs = await readFile(new URL("../docs/input-actions.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  for (const version of ["v0.19.0", "v0.19.1", "v0.19.2", "v0.19.3", "v0.19.4"]) {
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
  assert.equal(stage.includes("v0.19.4.md"), true);
  assert.equal(stage.includes("The `0.19.x` stage is complete"), true);
  assert.equal(closeoutPatch.includes("Pointer/Input Runtime Boundary Closeout"), true);
  assert.equal(closeoutPatch.includes("does not add pointer position tracking"), true);
  assert.equal(publicApi.includes("`0.19.x` closed pointer/input runtime primitives"), true);
  assert.equal(publicApi.includes("BrowserPointerButtonBridge"), true);
  assert.equal(inputDocs.includes("The `0.19.x` pointer/input runtime primitives stage is complete."), true);
  assert.equal(readme.includes("`0.19.x` pointer/input runtime primitives 阶段"), true);
  assert.equal(readme.includes("都已经收口"), true);
});

test("collision query stage docs are discoverable from roadmap and package docs", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.20.0.md", import.meta.url), "utf8");
  const patch = await readFile(new URL("../docs/version/v0.20.1.md", import.meta.url), "utf8");
  const toolingPatch = await readFile(new URL("../docs/version/v0.20.2.md", import.meta.url), "utf8");
  const closeoutPatch = await readFile(new URL("../docs/version/v0.20.3.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  for (const version of ["v0.20.0", "v0.20.1", "v0.20.2", "v0.20.3"]) {
    assert.equal(roadmap.includes(`version/${version}.md`), true, `roadmap should link ${version}`);
  }

  assert.equal(stage.includes("Collision Query Runtime Primitives Sprint"), true);
  assert.equal(stage.includes("The `0.20.x` stage is complete"), true);
  assert.equal(stage.includes("v0.20.2.md"), true);
  assert.equal(stage.includes("v0.20.3.md"), true);
  assert.equal(patch.includes("Collision Pair Query Baseline"), true);
  assert.equal(patch.includes("does not add a physics engine"), true);
  assert.equal(toolingPatch.includes("Collision Pair Tooling Snapshot Baseline"), true);
  assert.equal(toolingPatch.includes("read-only runtime observability"), true);
  assert.equal(closeoutPatch.includes("Collision Query Runtime Boundary Closeout"), true);
  assert.equal(closeoutPatch.includes("does not add physics simulation"), true);
  assert.equal(publicApi.includes("`0.20.x` closed collision query runtime primitives"), true);
  assert.equal(publicApi.includes("structured collision pair query methods"), true);
  assert.equal(publicApi.includes("read-only collision snapshots"), true);
  assert.equal(readme.includes("collision query runtime boundary closeout"), true);
  assert.equal(readme.includes("`0.20.x` collision query runtime primitives 阶段"), true);
  assert.equal(readme.includes("都已经收口"), true);
});

test("audio runtime stage docs are discoverable from roadmap", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.21.0.md", import.meta.url), "utf8");
  const patch = await readFile(new URL("../docs/version/v0.21.1.md", import.meta.url), "utf8");
  const systemPatch = await readFile(new URL("../docs/version/v0.21.2.md", import.meta.url), "utf8");
  const toolingPatch = await readFile(new URL("../docs/version/v0.21.3.md", import.meta.url), "utf8");
  const examplePatch = await readFile(new URL("../docs/version/v0.21.4.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  for (const version of ["v0.21.0", "v0.21.1", "v0.21.2", "v0.21.3", "v0.21.4"]) {
    assert.equal(roadmap.includes(`version/${version}.md`), true, `roadmap should link ${version}`);
  }

  assert.equal(stage.includes("Audio Runtime Primitives Sprint"), true);
  assert.equal(stage.includes("not as a visual audio editor"), true);
  assert.equal(stage.includes("v0.21.1.md"), true);
  assert.equal(stage.includes("v0.21.2.md"), true);
  assert.equal(stage.includes("v0.21.3.md"), true);
  assert.equal(stage.includes("v0.21.4.md"), true);
  assert.equal(patch.includes("Audio Data Contract Baseline"), true);
  assert.equal(patch.includes("does not add Web Audio playback"), true);
  assert.equal(systemPatch.includes("Audio Runtime Service Integration"), true);
  assert.equal(systemPatch.includes("does not add Web Audio playback"), true);
  assert.equal(systemPatch.includes("scene/runtime ownership"), true);
  assert.equal(toolingPatch.includes("Audio Runtime Tooling Visibility"), true);
  assert.equal(toolingPatch.includes("read-only runtime observability"), true);
  assert.equal(toolingPatch.includes("does not add playback controls"), true);
  assert.equal(examplePatch.includes("Audio Runtime Example Consumption and Boundary Closeout"), true);
  assert.equal(examplePatch.includes("does not add Web Audio playback"), true);
  assert.equal(examplePatch.includes("downstream-style package consumer"), true);
  assert.equal(publicApi.includes("`0.21.x` closed audio runtime primitives"), true);
  assert.equal(publicApi.includes("AudioRuntimeState"), true);
  assert.equal(publicApi.includes("AudioRuntimeSystem"), true);
  assert.equal(publicApi.includes("read-only audio runtime snapshots"), true);
  assert.equal(readme.includes("`0.21.x` audio runtime primitives 阶段和 `0.22.x` audio playback adapter 阶段都已经收口"), true);
});

test("audio playback adapter stage docs are discoverable from roadmap", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.22.0.md", import.meta.url), "utf8");
  const patch = await readFile(new URL("../docs/version/v0.22.1.md", import.meta.url), "utf8");
  const systemPatch = await readFile(new URL("../docs/version/v0.22.2.md", import.meta.url), "utf8");
  const browserPatch = await readFile(new URL("../docs/version/v0.22.3.md", import.meta.url), "utf8");
  const examplePatch = await readFile(new URL("../docs/version/v0.22.4.md", import.meta.url), "utf8");
  const runtimeIndex = await readFile(new URL("../src/runtime/index.ts", import.meta.url), "utf8");
  const browserAudio = await readFile(new URL("../src/runtime/browser-audio.ts", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  for (const version of ["v0.22.0", "v0.22.1", "v0.22.2", "v0.22.3", "v0.22.4"]) {
    assert.equal(roadmap.includes(`version/${version}.md`), true, `roadmap should link ${version}`);
  }

  assert.equal(stage.includes("Audio Playback Adapter Sprint"), true);
  assert.equal(stage.includes("not an editor, mixer, DAW, waveform UI, or content authoring workflow"), true);
  assert.equal(stage.includes("v0.22.1.md"), true);
  assert.equal(stage.includes("v0.22.2.md"), true);
  assert.equal(patch.includes("Audio Playback Adapter Contract Baseline"), true);
  assert.equal(patch.includes("does not add Web Audio playback"), true);
  assert.equal(patch.includes("Node-safe adapter contract"), true);
  assert.equal(systemPatch.includes("Audio Playback System Draining Integration"), true);
  assert.equal(systemPatch.includes("does not add Web Audio playback"), true);
  assert.equal(systemPatch.includes("opt-in scene/system draining integration"), true);
  assert.equal(stage.includes("v0.22.4.md"), true);
  assert.equal(browserPatch.includes("Browser Audio Playback Adapter Baseline"), true);
  assert.equal(browserPatch.includes("opt-in browser runtime adapter"), true);
  assert.equal(browserPatch.includes("not audio authoring"), true);
  assert.equal(examplePatch.includes("Audio Playback Example Consumption and Boundary Closeout"), true);
  assert.equal(examplePatch.includes("downstream-style browser example"), true);
  assert.equal(examplePatch.includes("does not add an audio editor"), true);
  assert.equal(examplePatch.includes("playback buttons, volume sliders, mixer controls"), true);
  assert.equal(runtimeIndex.includes('export * from "./browser-audio.js"'), true);
  assert.equal(browserAudio.includes("class BrowserAudioPlaybackAdapter"), true);
  assert.equal(browserAudio.includes("new Audio(source)"), true);
  assert.equal(publicApi.includes("`v0.22.4` closes audio playback adapter work"), true);
  assert.equal(publicApi.includes("does not add playback buttons, volume sliders, mixer controls"), true);
  assert.equal(readme.includes("dodge-blocks opt-in audio playback consumption"), true);
  assert.equal(readme.includes("`0.22.x` audio playback adapter 阶段都已经收口"), true);
});

test("camera runtime contract stage docs are discoverable from roadmap", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.23.0.md", import.meta.url), "utf8");
  const viewportPatch = await readFile(new URL("../docs/version/v0.23.1.md", import.meta.url), "utf8");
  const boundsPatch = await readFile(new URL("../docs/version/v0.23.2.md", import.meta.url), "utf8");
  const toolingPatch = await readFile(new URL("../docs/version/v0.23.3.md", import.meta.url), "utf8");
  const cameraSource = await readFile(new URL("../src/framework/camera.ts", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.equal(roadmap.includes("version/v0.23.0.md"), true);
  assert.equal(roadmap.includes("version/v0.23.1.md"), true);
  assert.equal(roadmap.includes("version/v0.23.2.md"), true);
  assert.equal(roadmap.includes("version/v0.23.3.md"), true);
  assert.equal(roadmap.includes("version/v0.24.0.md"), true);
  assert.equal(roadmap.includes("camera runtime contract"), true);
  assert.equal(roadmap.includes("暂缓"), true);
  assert.equal(stage.includes("Camera Runtime Contract Hardening Sprint"), true);
  assert.equal(stage.includes("CameraSystem"), true);
  assert.equal(stage.includes("v0.23.1.md"), true);
  assert.equal(stage.includes("v0.23.2.md"), true);
  assert.equal(stage.includes("v0.23.3.md"), true);
  assert.equal(stage.includes("The `0.23.x` stage has completed `v0.23.1`"), true);
  assert.equal(stage.includes("and `v0.23.2`, which adds camera bounds and follow clamping primitives"), true);
  assert.equal(stage.includes("world/screen coordinate conversion"), true);
  assert.equal(stage.includes("camera bounds/follow behavior is deterministic and tested"), true);
  assert.equal(stage.includes("prioritizes playable-game primitives over additional tooling polish"), true);
  assert.equal(stage.includes("not an editor, cinematic timeline"), true);
  assert.equal(stage.includes("visual scene editors"), true);
  assert.equal(stage.includes("read-only camera tooling snapshots"), true);
  assert.equal(viewportPatch.includes("Camera Viewport and Coordinate Conversion Baseline"), true);
  assert.equal(viewportPatch.includes("world-to-viewport coordinate conversion"), true);
  assert.equal(viewportPatch.includes("viewport-to-world coordinate conversion"), true);
  assert.equal(viewportPatch.includes("does not add visual scene editors"), true);
  assert.equal(viewportPatch.includes("does not include:"), true);
  assert.equal(viewportPatch.includes("read-only tooling snapshots"), true);
  assert.equal(boundsPatch.includes("Camera Bounds and Follow Clamping Primitives"), true);
  assert.equal(boundsPatch.includes("a small camera bounds data contract"), true);
  assert.equal(boundsPatch.includes("clamping manual `moveTo(...)` calls to bounds"), true);
  assert.equal(boundsPatch.includes("Follow behavior should also resolve to a clamped camera center"), true);
  assert.equal(boundsPatch.includes("does not add visual scene editors"), true);
  assert.equal(boundsPatch.includes("camera smoothing, shake, damping, or transitions"), true);
  assert.equal(toolingPatch.includes("Camera Read-only Tooling Snapshot Visibility"), true);
  assert.equal(toolingPatch.includes("Status: deferred after product realignment toward playable-game primitives"), true);
  assert.equal(toolingPatch.includes("a Node-safe camera tooling snapshot helper"), true);
  assert.equal(toolingPatch.includes("optional aggregate `createToolingSnapshot(...)` camera inclusion"), true);
  assert.equal(toolingPatch.includes("does not add visual scene editors"), true);
  assert.equal(toolingPatch.includes("camera mutation controls"), true);
  assert.equal(toolingPatch.includes("Camera tooling reads `CameraSystem`; it does not create, move, zoom, follow, clamp, or destroy cameras"), true);
  assert.equal(cameraSource.includes("export type CameraViewportState"), true);
  assert.equal(cameraSource.includes("getViewportState()"), true);
  assert.equal(cameraSource.includes("worldToViewport"), true);
  assert.equal(cameraSource.includes("viewportToWorld"), true);
  assert.equal(cameraSource.includes("export type CameraBounds"), true);
  assert.equal(cameraSource.includes("setBounds"), true);
  assert.equal(cameraSource.includes("getBounds"), true);
  assert.equal(cameraSource.includes("clearBounds"), true);
  assert.equal(publicApi.includes("`v0.23.1` starts camera runtime contract hardening"), true);
  assert.equal(publicApi.includes("not visual scene editing, camera timeline authoring"), true);
  assert.equal(publicApi.includes("`v0.23.2` adds camera bounds and follow clamping primitives"), true);
  assert.equal(publicApi.includes("not camera authoring UI, editor gizmos"), true);
  assert.equal(readme.includes("`v0.24.1` Normalized Directional Movement Baseline"), true);
  assert.equal(readme.includes("`0.23.x` camera runtime contract hardening 阶段已经完成 viewport/coordinate conversion baseline 和 bounds/follow clamping primitives"), true);
  assert.equal(readme.includes("`v0.23.3` camera read-only tooling visibility 已记录但暂缓"), true);
});

test("playable game kit stage docs are discoverable from roadmap and README", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.24.0.md", import.meta.url), "utf8");
  const movementPatch = await readFile(new URL("../docs/version/v0.24.1.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.equal(roadmap.includes("version/v0.24.0.md"), true);
  assert.equal(roadmap.includes("version/v0.24.1.md"), true);
  assert.equal(roadmap.includes("playable 2D game kit"), true);
  assert.equal(stage.includes("Playable 2D Game Kit Sprint"), true);
  assert.equal(stage.includes("4399-style browser game"), true);
  assert.equal(stage.includes("normalized directional movement"), true);
  assert.equal(stage.includes("actor/prefab-like gameplay composition helpers"), true);
  assert.equal(stage.includes("runtime HUD/game UI helpers"), true);
  assert.equal(stage.includes("not an editor, visual authoring tool"), true);
  assert.equal(stage.includes("v0.23.3` camera read-only tooling visibility is intentionally deferred"), true);
  assert.equal(movementPatch.includes("Normalized Directional Movement Baseline"), true);
  assert.equal(movementPatch.includes("diagonal movement becomes faster than horizontal or vertical movement"), true);
  assert.equal(movementPatch.includes("A vector longer than the configured maximum is scaled down while preserving direction"), true);
  assert.equal(movementPatch.includes("does not add player controllers for a specific game"), true);
  assert.equal(publicApi.includes("`v0.24.1` starts the playable 2D game kit stage"), true);
  assert.equal(publicApi.includes("limitMovementVector"), true);
  assert.equal(readme.includes("`v0.24.1` Normalized Directional Movement Baseline"), true);
  assert.equal(readme.includes("复刻一个简单 4399 小游戏"), true);
  assert.equal(readme.includes("Playable movement primitives"), true);
  assert.equal(readme.includes("tooling 保持辅助观察，不抢产品主线"), true);
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
    "AudioRuntimeState",
    "AudioRuntimeSystem",
    "AudioPlaybackSystem",
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
    "addAudioPlayback",
    "addAudioRuntime",
    "advanceSpriteAnimationPlayback",
    "addRuntimeServices",
    "bootstrapSceneFromConfig",
    "createAudioRuntimeState",
    "createLevelLayout",
    "createTileMap",
    "createSpriteAnimationPlayback",
    "createDefaultComponentSchemaRegistry",
    "createRuntimeServices",
    "defineAudioAsset",
    "defineAudioChannel",
    "defineAudioCue",
    "defineAudioManifest",
    "defineLevelLayout",
    "defineTileMap",
    "defineKeyboardBinding",
    "definePointerButtonBinding",
    "defineSpriteAnimationClip",
    "defineSpriteFrame",
    "dispatchAudioRuntimeOperation",
    "drainAudioRuntimeOperations",
    "getAudioPlayback",
    "getAudioRuntime",
    "getPointerButtonInputId",
    "getSpriteAnimationPlaybackFrameId",
    "getSpriteAnimationPlaybackFrameIndex",
    "getRuntimeServices",
    "isSpriteCapableRenderNode",
    "limitMovementVector",
    "loadAssetManifestAsync",
    "normalizeKeyboardKey",
    "normalizePointerButton",
    "validateSceneConfig"
  ]);
  assert.equal(typeof framework.CollisionSystem.prototype.getCollisionPairs, "function");
  assert.equal(typeof framework.CollisionSystem.prototype.getCollisionEnterPairs, "function");
  assert.equal(typeof framework.CollisionSystem.prototype.getCollisionStayPairs, "function");
  assert.equal(typeof framework.CollisionSystem.prototype.getCollisionExitPairs, "function");
  assert.equal(typeof framework.AudioRuntimeState.prototype.playCue, "function");
  assert.equal(typeof framework.AudioRuntimeState.prototype.setChannelVolume, "function");
  assert.equal(typeof framework.AudioRuntimeSystem.prototype.destroy, "function");
  assert.equal(typeof framework.AudioPlaybackSystem.prototype.drain, "function");
  assert.equal(typeof framework.CameraSystem.prototype.getViewportState, "function");
  assert.equal(typeof framework.CameraSystem.prototype.worldToViewport, "function");
  assert.equal(typeof framework.CameraSystem.prototype.viewportToWorld, "function");
  assert.equal(typeof framework.CameraSystem.prototype.setBounds, "function");
  assert.equal(typeof framework.CameraSystem.prototype.getBounds, "function");
  assert.equal(typeof framework.CameraSystem.prototype.clearBounds, "function");
  assert.equal(typeof framework.limitMovementVector, "function");
  assert.equal(typeof framework.addAudioPlayback, "function");
  assert.equal(typeof framework.addAudioRuntime, "function");
  assert.equal(typeof framework.dispatchAudioRuntimeOperation, "function");
  assert.equal(typeof framework.drainAudioRuntimeOperations, "function");
  assert.equal(typeof framework.getAudioPlayback, "function");
  assert.equal(typeof framework.getAudioRuntime, "function");
});

test("tooling package subpath can be imported by package name in Node", async () => {
  const tooling = await import(`${packageJson.name}/tooling`);

  assertExports(tooling, [
    "createAudioRuntimePanelSection",
    "createAudioRuntimeSnapshot",
    "createCollisionSnapshot",
    "createCollisionsPanelSection",
    "createDebugSnapshot",
    "createInputActionSnapshot",
    "createInputActionsPanelSection",
    "createRuntimeServicesPanelSection",
    "createRuntimeServicesSnapshot",
    "createSpriteAnimationSnapshot",
    "createSpriteAnimationsPanelSection",
    "createToolingSnapshot",
    "createToolingPanelSections",
    "formatAudioRuntimeSnapshot",
    "formatCollisionSnapshot",
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
  assert.equal(source.includes("audio: true"), true, "boot should pass audio runtime state into tooling snapshots");
  assert.equal(source.includes("game: runtime.game"), true, "boot should pass Game time state into tooling snapshots");
  assert.equal(source.includes("renderScene: runtime.renderScene"), true, "boot should pass viewport state into tooling snapshots");
  assert.equal(source.includes("collisions: true"), true, "boot should pass collision pair state into tooling snapshots");
});

test("dodge-blocks example consumes opt-in browser audio playback APIs without editor scope", async () => {
  const sceneSource = await readFile(new URL("dodge-blocks-scene.ts", dodgeBlocksExampleUrl), "utf8");
  const gameplaySource = await readFile(new URL("dodge-game-system.ts", dodgeBlocksExampleUrl), "utf8");
  const bootSource = await readFile(new URL("boot.ts", dodgeBlocksExampleUrl), "utf8");
  const docs = await readFile(new URL("README.md", dodgeBlocksExampleUrl), "utf8");

  assert.equal(sceneSource.includes("addAudioRuntime"), true);
  assert.equal(sceneSource.includes("DODGE_BLOCKS_AUDIO_MANIFEST"), true);
  assert.equal(sceneSource.includes("source: createToneAudioDataUri"), true);
  assert.equal(sceneSource.includes('id: "ui-confirm"'), true);
  assert.equal(sceneSource.includes('id: "player-hit"'), true);
  assert.equal(sceneSource.includes('GameStart: "game:start"'), true);
  assert.equal(sceneSource.includes('PlayerHit: "player:hit"'), true);
  assert.equal(gameplaySource.includes("getAudioRuntime"), true);
  assert.equal(gameplaySource.includes("playAudioCue"), true);
  assert.equal(gameplaySource.includes('GamePause: "game:pause"'), true);
  assert.equal(gameplaySource.includes('GameResume: "game:resume"'), true);
  assert.equal(bootSource.includes("BrowserAudioPlaybackAdapter"), true);
  assert.equal(bootSource.includes("addAudioPlayback"), true);
  assert.equal(bootSource.includes("getAudioRuntime"), true);
  assert.equal(bootSource.includes("priority: 260"), true);
  assert.equal(bootSource.includes("audio: true"), true);
  assert.equal(docs.includes("semantic audio cue intent"), true);
  assert.equal(docs.includes("AudioPlaybackSystem"), true);
  assert.equal(docs.includes("BrowserAudioPlaybackAdapter"), true);
  assert.equal(docs.includes("placeholder audio source"), true);
  assert.equal(docs.includes("不提供播放按钮、音量滑条、mixer、waveform、asset browser"), true);
  assert.equal(docs.includes("不引入 Web Audio graph、mixer、音频编辑器或音频内容生产能力"), true);
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
  assert.equal(source.includes("Collisions` panel"), true);
  assert.equal(source.includes("system order"), true);
  assert.equal(source.includes("system lifecycle"), true);
  assert.equal(source.includes("current / enter / stay / exit collision pair summary"), true);
  assert.equal(source.includes("不提供系统开关、组件改值、场景编辑、音频编辑或资产管理入口"), true);
});
