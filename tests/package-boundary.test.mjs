import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
);
const examplesRootUrl = new URL("../examples/", import.meta.url);
const dodgeBlocksExampleUrl = new URL("../examples/dodge-blocks/", import.meta.url);
const collectStarsExampleUrl = new URL("../examples/collect-stars/", import.meta.url);
const pourSortExampleUrl = new URL("../examples/pour-sort/", import.meta.url);

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
  assert.equal(readme.includes("`0.21.x` audio runtime primitives 阶段"), true);
  assert.equal(readme.includes("`0.22.x` audio playback adapter 阶段"), true);
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
  assert.equal(readme.includes("`0.22.x` audio playback adapter 阶段"), true);
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
  assert.equal(readme.includes("`v0.26.5` Framework Extraction Closeout From Two Playable Examples"), true);
  assert.equal(readme.includes("`0.23.x` camera runtime contract hardening 阶段已经完成 viewport/coordinate conversion baseline 和 bounds/follow clamping primitives"), true);
  assert.equal(readme.includes("`v0.23.3` camera read-only tooling visibility 已记录但暂缓"), true);
});

test("playable game kit stage docs are discoverable from roadmap and README", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.24.0.md", import.meta.url), "utf8");
  const movementPatch = await readFile(new URL("../docs/version/v0.24.1.md", import.meta.url), "utf8");
  const actorPatch = await readFile(new URL("../docs/version/v0.24.2.md", import.meta.url), "utf8");
  const hudPatch = await readFile(new URL("../docs/version/v0.24.3.md", import.meta.url), "utf8");
  const tileViewPatch = await readFile(new URL("../docs/version/v0.24.4.md", import.meta.url), "utf8");
  const closeoutPatch = await readFile(new URL("../docs/version/v0.24.5.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.equal(roadmap.includes("version/v0.24.0.md"), true);
  assert.equal(roadmap.includes("version/v0.24.1.md"), true);
  assert.equal(roadmap.includes("version/v0.24.2.md"), true);
  assert.equal(roadmap.includes("version/v0.24.3.md"), true);
  assert.equal(roadmap.includes("version/v0.24.4.md"), true);
  assert.equal(roadmap.includes("version/v0.24.5.md"), true);
  assert.equal(roadmap.includes("playable 2D game kit"), true);
  assert.equal(stage.includes("Playable 2D Game Kit Sprint"), true);
  assert.equal(stage.includes("4399-style browser game"), true);
  assert.equal(stage.includes("normalized directional movement"), true);
  assert.equal(stage.includes("v0.24.2.md"), true);
  assert.equal(stage.includes("actor/prefab-like gameplay composition helpers"), true);
  assert.equal(stage.includes("runtime HUD/game UI helpers"), true);
  assert.equal(stage.includes("not an editor, visual authoring tool"), true);
  assert.equal(stage.includes("v0.23.3` camera read-only tooling visibility is intentionally deferred"), true);
  assert.equal(movementPatch.includes("Normalized Directional Movement Baseline"), true);
  assert.equal(movementPatch.includes("diagonal movement becomes faster than horizontal or vertical movement"), true);
  assert.equal(movementPatch.includes("A vector longer than the configured maximum is scaled down while preserving direction"), true);
  assert.equal(movementPatch.includes("does not add player controllers for a specific game"), true);
  assert.equal(actorPatch.includes("Actor Template Composition Baseline"), true);
  assert.equal(actorPatch.includes("defineActorTemplate"), true);
  assert.equal(actorPatch.includes("does not add a visual prefab editor"), true);
  assert.equal(actorPatch.includes("Every actor template includes `transform` and `size`"), true);
  assert.equal(hudPatch.includes("Runtime HUD Text Helper Baseline"), true);
  assert.equal(hudPatch.includes("createHudText"), true);
  assert.equal(hudPatch.includes("does not add a visual UI editor"), true);
  assert.equal(hudPatch.includes("HUD text is screen-space by default"), true);
  assert.equal(tileViewPatch.includes("Tile Map Layer View Baseline"), true);
  assert.equal(tileViewPatch.includes("createTileMapLayerView"), true);
  assert.equal(tileViewPatch.includes("does not add a tile map editor"), true);
  assert.equal(tileViewPatch.includes("Empty `null` tiles are skipped"), true);
  assert.equal(closeoutPatch.includes("Playable Example Closeout And Package Docs"), true);
  assert.equal(closeoutPatch.includes("DodgeGameSystem.getGameplaySnapshot"), true);
  assert.equal(closeoutPatch.includes("does not add an editor"), true);
  assert.equal(closeoutPatch.includes("This is an example-level closeout helper"), true);
  assert.equal(publicApi.includes("`v0.24.1` starts the playable 2D game kit stage"), true);
  assert.equal(publicApi.includes("limitMovementVector"), true);
  assert.equal(publicApi.includes("`v0.24.2` adds actor template composition"), true);
  assert.equal(publicApi.includes("defineActorTemplate"), true);
  assert.equal(publicApi.includes("`v0.24.3` adds a runtime HUD text helper"), true);
  assert.equal(publicApi.includes("createHudText"), true);
  assert.equal(publicApi.includes("`v0.24.4` adds a runtime tile map layer view helper"), true);
  assert.equal(publicApi.includes("createTileMapLayerView"), true);
  assert.equal(publicApi.includes("`v0.24.5` closes the playable 2D game kit stage"), true);
  assert.equal(publicApi.includes("DodgeGameSystem"), true);
  assert.equal(readme.includes("`v0.26.5` Framework Extraction Closeout From Two Playable Examples"), true);
  assert.equal(readme.includes("复刻一个简单 4399 小游戏"), true);
  assert.equal(readme.includes("Playable movement primitives"), true);
  assert.equal(readme.includes("actor template composition baseline"), true);
  assert.equal(readme.includes("runtime HUD text helper baseline"), true);
  assert.equal(readme.includes("tile map layer view baseline"), true);
  assert.equal(readme.includes("playable example closeout baseline"), true);
  assert.equal(readme.includes("tooling 保持辅助观察，不抢产品主线"), true);
});

test("second playable example stage docs are discoverable from roadmap and README", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.25.0.md", import.meta.url), "utf8");
  const shellPatch = await readFile(new URL("../docs/version/v0.25.1.md", import.meta.url), "utf8");
  const gameplayPatch = await readFile(new URL("../docs/version/v0.25.2.md", import.meta.url), "utf8");
  const hardeningPatch = await readFile(new URL("../docs/version/v0.25.3.md", import.meta.url), "utf8");
  const closeoutPatch = await readFile(new URL("../docs/version/v0.25.4.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.equal(roadmap.includes("version/v0.25.0.md"), true);
  assert.equal(roadmap.includes("version/v0.25.1.md"), true);
  assert.equal(roadmap.includes("version/v0.25.2.md"), true);
  assert.equal(roadmap.includes("version/v0.25.3.md"), true);
  assert.equal(roadmap.includes("version/v0.25.4.md"), true);
  assert.equal(roadmap.includes("第二个 playable example"), true);
  assert.equal(stage.includes("Second Playable Example Sprint"), true);
  assert.equal(stage.includes("outside a single dodge-blocks sample"), true);
  assert.equal(stage.includes("not an editor, template marketplace, visual scene builder"), true);
  assert.equal(stage.includes("v0.25.1.md"), true);
  assert.equal(stage.includes("v0.25.2.md"), true);
  assert.equal(stage.includes("v0.25.3.md"), true);
  assert.equal(stage.includes("v0.25.4.md"), true);
  assert.equal(stage.includes("second example shell and routing/build baseline"), true);
  assert.equal(stage.includes("The `0.25.x` stage is closed through `v0.25.4`"), true);
  assert.equal(stage.includes("did not add a new framework abstraction"), true);
  assert.equal(stage.includes("broad framework abstractions before two examples prove the need"), true);
  assert.equal(shellPatch.includes("Second Example Shell And Routing Baseline"), true);
  assert.equal(shellPatch.includes("examples/collect-stars"), true);
  assert.equal(shellPatch.includes("does not add an example launcher product"), true);
  assert.equal(shellPatch.includes("not a completed playable game"), true);
  assert.equal(gameplayPatch.includes("Collect Stars Gameplay Loop Baseline"), true);
  assert.equal(gameplayPatch.includes("ready / running / ended phases through `GameFlow`"), true);
  assert.equal(gameplayPatch.includes("collision-based star collection"), true);
  assert.equal(gameplayPatch.includes("does not add a visual editor"), true);
  assert.equal(hardeningPatch.includes("Collect Stars Package API Consumption Hardening"), true);
  assert.equal(hardeningPatch.includes("defineActorTemplate(...)` and `instantiateEntityTemplate(...)"), true);
  assert.equal(hardeningPatch.includes("does not add a visual editor"), true);
  assert.equal(hardeningPatch.includes("new framework helpers extracted from collect-stars"), true);
  assert.equal(closeoutPatch.includes("Second Playable Example Docs And Stage Closeout"), true);
  assert.equal(closeoutPatch.includes("examples/dodge-blocks"), true);
  assert.equal(closeoutPatch.includes("examples/collect-stars"), true);
  assert.equal(closeoutPatch.includes("No new framework API is added"), true);
  assert.equal(closeoutPatch.includes("not become editor, authoring, launcher, template marketplace"), true);
  assert.equal(publicApi.includes("`v0.25.0` starts the second playable example stage"), true);
  assert.equal(publicApi.includes("`v0.25.1` adds the second example shell"), true);
  assert.equal(publicApi.includes("`v0.25.2` turns `collect-stars` into a minimal playable collection loop"), true);
  assert.equal(publicApi.includes("`v0.25.3` hardens `collect-stars` package API consumption"), true);
  assert.equal(publicApi.includes("`v0.25.4` closes the second playable example stage"), true);
  assert.equal(publicApi.includes("two downstream-style browser examples with different gameplay loops"), true);
  assert.equal(publicApi.includes("defineActorTemplate(...)` plus `instantiateEntityTemplate(...)"), true);
  assert.equal(publicApi.includes("collect-stars"), true);
  assert.equal(publicApi.includes("package-style imports"), true);
  assert.equal(publicApi.includes("not an editor, example marketplace, visual launcher product"), true);
  assert.equal(readme.includes("`v0.26.5` Framework Extraction Closeout From Two Playable Examples"), true);
  assert.equal(readme.includes("`dodge-blocks`、`collect-stars` 和 `pour-sort` 三个 playable examples"), true);
  assert.equal(readme.includes("当前 examples 的意义"), true);
  assert.equal(readme.includes("More playable example pressure tests"), true);
});

test("framework extraction planning docs start from two examples without editor scope", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.26.0.md", import.meta.url), "utf8");
  const movementPatch = await readFile(new URL("../docs/version/v0.26.1.md", import.meta.url), "utf8");
  const snapshotPatch = await readFile(new URL("../docs/version/v0.26.2.md", import.meta.url), "utf8");
  const actorViewPatch = await readFile(new URL("../docs/version/v0.26.3.md", import.meta.url), "utf8");
  const randomPlacementPatch = await readFile(new URL("../docs/version/v0.26.4.md", import.meta.url), "utf8");
  const closeoutPatch = await readFile(new URL("../docs/version/v0.26.5.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.equal(roadmap.includes("version/v0.26.0.md"), true);
  assert.equal(roadmap.includes("version/v0.26.1.md"), true);
  assert.equal(roadmap.includes("version/v0.26.2.md"), true);
  assert.equal(roadmap.includes("version/v0.26.3.md"), true);
  assert.equal(roadmap.includes("version/v0.26.4.md"), true);
  assert.equal(roadmap.includes("version/v0.26.5.md"), true);
  assert.equal(roadmap.includes("从重复痛点反推 framework extraction"), true);
  assert.equal(roadmap.includes("重复移动边界逻辑"), true);
  assert.equal(roadmap.includes("只读 gameplay snapshot 约定"), true);
  assert.equal(roadmap.includes("actor/view 装配重复代码"), true);
  assert.equal(roadmap.includes("runtime spawn/random placement 重复逻辑"), true);
  assert.equal(roadmap.includes("`0.26.x` 最后建议收口"), true);
  assert.equal(stage.includes("Framework Extraction From Two Playable Examples Sprint"), true);
  assert.equal(stage.includes("does not add public framework API by itself"), true);
  assert.equal(stage.includes("Bounded Directional Movement"), true);
  assert.equal(stage.includes("Gameplay Loop State Helpers"), true);
  assert.equal(stage.includes("Actor And Runtime Spawn Helpers"), true);
  assert.equal(stage.includes("HUD And Gameplay Snapshot Conventions"), true);
  assert.equal(stage.includes("examples remain downstream consumers"), true);
  assert.equal(stage.includes("visual editor UI"), true);
  assert.equal(stage.includes("example launcher or game gallery product"), true);
  assert.equal(stage.includes("large gameplay framework abstractions before small helpers prove themselves"), true);
  assert.equal(stage.includes("v0.26.1"), true);
  assert.equal(stage.includes("v0.26.5"), true);
  assert.equal(stage.includes("The `0.26.x` stage is complete"), true);
  assert.equal(stage.includes("The stage is closed through `v0.26.5`"), true);
  assert.equal(stage.includes("The stage intentionally did not extract game-specific player controllers"), true);
  assert.equal(movementPatch.includes("Bounded Position Clamp Helper Baseline"), true);
  assert.equal(movementPatch.includes("clampPositionToBounds(...)"), true);
  assert.equal(movementPatch.includes("Both `examples/dodge-blocks` and `examples/collect-stars`"), true);
  assert.equal(movementPatch.includes("does not add a visual editor"), true);
  assert.equal(movementPatch.includes("does not include:"), true);
  assert.equal(movementPatch.includes("a generic player controller component"), true);
  assert.equal(snapshotPatch.includes("Gameplay Snapshot Convention Baseline"), true);
  assert.equal(snapshotPatch.includes("adds no new public package API"), true);
  assert.equal(snapshotPatch.includes("CollectStarsGameSystem.getGameplaySnapshot()"), true);
  assert.equal(snapshotPatch.includes("example-owned read-only gameplay snapshot pattern"), true);
  assert.equal(snapshotPatch.includes("does not include:"), true);
  assert.equal(snapshotPatch.includes("a generic score system"), true);
  assert.equal(actorViewPatch.includes("Actor Sprite View Attachment Helper Baseline"), true);
  assert.equal(actorViewPatch.includes("attachActorSpriteView(...)"), true);
  assert.equal(actorViewPatch.includes("Both playable examples repeatedly create a sprite render node"), true);
  assert.equal(actorViewPatch.includes("It does not create entities"), true);
  assert.equal(actorViewPatch.includes("a generic actor spawn system"), true);
  assert.equal(randomPlacementPatch.includes("Random Position In Bounds Helper Baseline"), true);
  assert.equal(randomPlacementPatch.includes("randomPositionInBounds(...)"), true);
  assert.equal(randomPlacementPatch.includes("Both playable examples need to choose a top-left position"), true);
  assert.equal(randomPlacementPatch.includes("It does not extract a spawn system"), true);
  assert.equal(randomPlacementPatch.includes("a generic spawn system"), true);
  assert.equal(closeoutPatch.includes("Framework Extraction Closeout From Two Playable Examples"), true);
  assert.equal(closeoutPatch.includes("No new public package API is added in this closeout"), true);
  assert.equal(closeoutPatch.includes("clampPositionToBounds(...)"), true);
  assert.equal(closeoutPatch.includes("attachActorSpriteView(...)"), true);
  assert.equal(closeoutPatch.includes("randomPositionInBounds(...)"), true);
  assert.equal(closeoutPatch.includes("gameplay snapshot pattern remains example-owned"), true);
  assert.equal(closeoutPatch.includes("did not add:"), true);
  assert.equal(closeoutPatch.includes("a generic spawn system"), true);
  assert.equal(publicApi.includes("`v0.26.0` starts the framework extraction stage from two playable examples"), true);
  assert.equal(publicApi.includes("adds no new public API"), true);
  assert.equal(publicApi.includes("bounded directional movement"), true);
  assert.equal(publicApi.includes("`v0.26.1` adds `clampPositionToBounds(...)`"), true);
  assert.equal(publicApi.includes("Both `examples/dodge-blocks` and `examples/collect-stars` now consume it"), true);
  assert.equal(publicApi.includes("`v0.26.2` adds no new public package API"), true);
  assert.equal(publicApi.includes("phase, score, remaining time, active star state"), true);
  assert.equal(publicApi.includes("`v0.26.3` adds `attachActorSpriteView(...)`"), true);
  assert.equal(publicApi.includes("not a generic actor spawn system, prefab format"), true);
  assert.equal(publicApi.includes("`v0.26.4` adds `randomPositionInBounds(...)`"), true);
  assert.equal(publicApi.includes("not a generic spawn system, spawn scheduler"), true);
  assert.equal(publicApi.includes("`v0.26.5` closes the framework extraction stage"), true);
  assert.equal(publicApi.includes("without adding new public package API"), true);
  assert.equal(publicApi.includes("gameplay snapshot pattern remains example-owned"), true);
  assert.equal(publicApi.includes("not a visual editor, prefab authoring tool, launcher, gallery"), true);
  assert.equal(readme.includes("`v0.26.5` Framework Extraction Closeout From Two Playable Examples"), true);
  assert.equal(readme.includes("`0.26.x` framework extraction from two playable examples 阶段和 `0.27.x` pointer-first puzzle interaction 阶段都已经收口"), true);
  assert.equal(readme.includes("抽出了 `clampPositionToBounds(...)`、`attachActorSpriteView(...)` 和 `randomPositionInBounds(...)`"), true);
  assert.equal(readme.includes("gameplay snapshot 固定为 example-owned read-only 约定"), true);
  assert.equal(readme.includes("framework extraction closeout"), true);
  assert.equal(readme.includes("不能把示例玩法、编辑器、launcher、gallery 或内容生产流程塞进引擎本体"), true);
});

test("pointer-first puzzle stage closes without swallowing puzzle rules", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.27.0.md", import.meta.url), "utf8");
  const closeoutPatch = await readFile(new URL("../docs/version/v0.27.6.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const frameworkSource = await readFile(new URL("../src/framework/index.ts", import.meta.url), "utf8");
  const pourSortScene = await readFile(new URL("pour-sort-scene.ts", pourSortExampleUrl), "utf8");

  assert.equal(roadmap.includes("version/v0.27.6.md"), true);
  assert.equal(stage.includes("The `0.27.x` stage is closed through `v0.27.6`"), true);
  assert.equal(stage.includes("keeping puzzle rules example-owned"), true);
  assert.equal(stage.includes("galgame dialogue/choice-flow primitives"), true);
  assert.equal(closeoutPatch.includes("Pointer-First Puzzle Interaction Stage Closeout"), true);
  assert.equal(closeoutPatch.includes("No new public package API is added in this closeout"), true);
  assert.equal(closeoutPatch.includes("InputSystem.setPointerPosition(...)"), true);
  assert.equal(closeoutPatch.includes("hitTestEntitiesAtPoint(...)"), true);
  assert.equal(closeoutPatch.includes("createSourceTargetSelectionState(...)"), true);
  assert.equal(closeoutPatch.includes("The exact puzzle rules stay in `examples/pour-sort`"), true);
  assert.equal(closeoutPatch.includes("galgame / interactive narrative prototypes"), true);
  assert.equal(closeoutPatch.includes("does not add a visual editor"), true);
  assert.equal(publicApi.includes("`v0.27.6` closes the pointer-first puzzle interaction stage"), true);
  assert.equal(publicApi.includes("without adding new public package API"), true);
  assert.equal(publicApi.includes("Water-sort rules, drag/drop state, undo, hints"), true);
  assert.equal(readme.includes("`v0.27.6` Pointer-First Puzzle Interaction Stage Closeout"), true);
  assert.equal(readme.includes("`0.27.x` pointer-first puzzle interaction 阶段都已经收口"), true);
  assert.equal(readme.includes("GitHub 仓库已创建；当前不使用 GitHub CI"), true);
  assert.equal(frameworkSource.includes("pourTopColor"), false);
  assert.equal(frameworkSource.includes("isPourSortSolved"), false);
  assert.equal(pourSortScene.includes("export function pourTopColor"), true);
  assert.equal(pourSortScene.includes("export function isPourSortSolved"), true);
});

test("real sprite image rendering stage starts without asset authoring scope", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.28.0.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

  assert.equal(roadmap.includes("version/v0.28.0.md"), true);
  assert.equal(stage.includes("Real Sprite / Image Rendering Sprint"), true);
  assert.equal(stage.includes("does not add public package API by itself"), true);
  assert.equal(stage.includes("sprite assets with `source` can visibly render through the Leafer adapter"), true);
  assert.equal(stage.includes("map `RenderSpriteAsset.source` into the Leafer render node"), true);
  assert.equal(stage.includes("preserve existing fill/width/height/cornerRadius rectangle behavior"), true);
  assert.equal(stage.includes("Asset Loading To Render Asset Handoff"), true);
  assert.equal(stage.includes("Example Image Asset Consumption"), true);
  assert.equal(stage.includes("does not add a visual asset manager"), true);
  assert.equal(stage.includes("atlas packer"), true);
  assert.equal(stage.includes("bundled art library"), true);
  assert.equal(publicApi.includes("`v0.28.0` starts the real sprite / image rendering stage"), true);
  assert.equal(publicApi.includes("adds no new public API"), true);
  assert.equal(publicApi.includes("not a visual asset manager, atlas packer"), true);
  assert.equal(readme.includes("`0.28.x` 开始补 1.0 前必须完成的真实 sprite / image rendering"), true);
  assert.equal(readme.includes("`RenderSpriteAsset.source`"), true);
});

test("image-backed leafer sprite adapter baseline keeps asset authoring out of scope", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.28.1.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const leaferAdapter = await readFile(new URL("../src/adapter/leafer/runtime.ts", import.meta.url), "utf8");

  assert.equal(roadmap.includes("version/v0.28.1.md"), true);
  assert.equal(stage.includes("Image-Backed Leafer Sprite Adapter Baseline"), true);
  assert.equal(stage.includes("maps `RenderSpriteAsset.source` to the native Leafer `Image.url`"), true);
  assert.equal(stage.includes("fill/width/height/cornerRadius placeholder behavior"), true);
  assert.equal(stage.includes("clears the previous image URL"), true);
  assert.equal(stage.includes("does not add or change public package API"), true);
  assert.equal(stage.includes("visual asset manager, atlas packer"), true);
  assert.equal(stage.includes("asset loading to render asset handoff"), true);
  assert.equal(publicApi.includes("`v0.28.1` adds the image-backed Leafer sprite adapter baseline"), true);
  assert.equal(publicApi.includes("without changing the public render contract"), true);
  assert.equal(publicApi.includes("not an asset authoring API"), true);
  assert.equal(readme.includes("在 `v0.28.1` 让 `RenderSpriteAsset.source` 映射到 Leafer `Image.url`"), true);
  assert.equal(readme.includes("映射到 Leafer `Image.url`"), true);
  assert.equal(leaferAdapter.includes("Image as LeaferImage"), true);
  assert.equal(leaferAdapter.includes("this.image.url = asset.source"), true);
});

test("asset loading to render asset handoff keeps asset tooling out of scope", async () => {
  const roadmap = await readFile(new URL("../docs/roadmap.md", import.meta.url), "utf8");
  const stage = await readFile(new URL("../docs/version/v0.28.2.md", import.meta.url), "utf8");
  const publicApi = await readFile(new URL("../docs/public-api.md", import.meta.url), "utf8");
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const assetsSource = await readFile(new URL("../src/framework/assets.ts", import.meta.url), "utf8");
  const animationSource = await readFile(new URL("../src/framework/animation.ts", import.meta.url), "utf8");
  const factorySource = await readFile(new URL("../src/framework/factory.ts", import.meta.url), "utf8");

  assert.equal(roadmap.includes("version/v0.28.2.md"), true);
  assert.equal(stage.includes("Asset Loading To Render Asset Handoff"), true);
  assert.equal(stage.includes("getSpriteRenderAsset(id)"), true);
  assert.equal(stage.includes("requireSpriteRenderAsset(id)"), true);
  assert.equal(stage.includes("without leaking registry-only state"), true);
  assert.equal(stage.includes("render nodes do not require a DOM image object"), true);
  assert.equal(stage.includes("does not add a visual asset manager"), true);
  assert.equal(stage.includes("bundler plugin"), true);
  assert.equal(publicApi.includes("`v0.28.2` adds the asset loading to render asset handoff baseline"), true);
  assert.equal(publicApi.includes("Render nodes still receive stable asset metadata and `source` strings"), true);
  assert.equal(readme.includes("`v0.28.2` Asset Loading To Render Asset Handoff"), true);
  assert.equal(readme.includes("AssetRegistry` 输出干净的 render asset 副本"), true);
  assert.equal(assetsSource.includes("getSpriteRenderAsset"), true);
  assert.equal(assetsSource.includes("requireSpriteRenderAsset"), true);
  assert.equal(animationSource.includes("requireSpriteRenderAsset(frame.spriteId)"), true);
  assert.equal(factorySource.includes("assetId?: string"), true);
  assert.equal(factorySource.includes("requireSpriteRenderAsset(options.assetId)"), true);
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
    "BrowserPointerPositionBridge",
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
    "attachActorSpriteView",
    "bootstrapSceneFromConfig",
    "clearSourceTargetSelection",
    "clearSourceTargetTarget",
    "createAudioRuntimeState",
    "createLevelLayout",
    "createSourceTargetSelectionState",
    "createTileMap",
    "createSpriteAnimationPlayback",
    "createDefaultComponentSchemaRegistry",
    "createHudText",
    "createRuntimeServices",
    "createTileMapLayerView",
    "defineAudioAsset",
    "defineAudioChannel",
    "defineAudioCue",
    "defineAudioManifest",
    "defineActorTemplate",
    "defineLevelLayout",
    "defineTileMap",
    "defineKeyboardBinding",
    "definePointerButtonBinding",
    "defineSpriteAnimationClip",
    "defineSpriteFrame",
    "dispatchAudioRuntimeOperation",
    "drainAudioRuntimeOperations",
    "getEntityHitRect",
    "getAudioPlayback",
    "getAudioRuntime",
    "getPointerButtonInputId",
    "getSpriteAnimationPlaybackFrameId",
    "getSpriteAnimationPlaybackFrameIndex",
    "getRuntimeServices",
    "getSourceTargetSelectionPair",
    "hitTestEntitiesAtPoint",
    "isSpriteCapableRenderNode",
    "clampPositionToBounds",
    "limitMovementVector",
    "loadAssetManifestAsync",
    "normalizeKeyboardKey",
    "normalizePointerButton",
    "pickTopEntityAtPoint",
    "pointInRect",
    "randomPositionInBounds",
    "selectSourceTargetSource",
    "selectSourceTargetTarget",
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
  assert.equal(typeof framework.attachActorSpriteView, "function");
  assert.equal(typeof framework.clampPositionToBounds, "function");
  assert.equal(typeof framework.limitMovementVector, "function");
  assert.equal(typeof framework.randomPositionInBounds, "function");
  assert.equal(typeof framework.defineActorTemplate, "function");
  assert.equal(typeof framework.createHudText, "function");
  assert.equal(typeof framework.createTileMapLayerView, "function");
  assert.equal(typeof framework.addAudioPlayback, "function");
  assert.equal(typeof framework.addAudioRuntime, "function");
  assert.equal(typeof framework.dispatchAudioRuntimeOperation, "function");
  assert.equal(typeof framework.drainAudioRuntimeOperations, "function");
  assert.equal(typeof framework.getAudioPlayback, "function");
  assert.equal(typeof framework.getAudioRuntime, "function");
  assert.equal(typeof framework.pointInRect, "function");
  assert.equal(typeof framework.pickTopEntityAtPoint, "function");
  assert.equal(typeof framework.createSourceTargetSelectionState, "function");
  assert.equal(typeof framework.selectSourceTargetSource, "function");
  assert.equal(typeof framework.selectSourceTargetTarget, "function");
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

test("examples import engine APIs through package-style entrypoints", async () => {
  const files = (await listFiles(examplesRootUrl))
    .filter((fileUrl) => fileUrl.pathname.endsWith(".ts"));

  for (const fileUrl of files) {
    const source = await readFile(fileUrl, "utf8");
    assert.equal(source.includes("../../src/"), false, `${fileUrl.pathname} should not import engine APIs from src`);
  }
});

test("collect-stars example gameplay loop is routed and package-facing", async () => {
  const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const examplesEntry = await readFile(new URL("main.ts", examplesRootUrl), "utf8");
  const sceneSource = await readFile(new URL("collect-stars-scene.ts", collectStarsExampleUrl), "utf8");
  const bootSource = await readFile(new URL("boot.ts", collectStarsExampleUrl), "utf8");
  const actionsSource = await readFile(new URL("input-actions.ts", collectStarsExampleUrl), "utf8");
  const actorsSource = await readFile(new URL("collect-stars-actors.ts", collectStarsExampleUrl), "utf8");
  const playerControllerSource = await readFile(new URL("player-controller.ts", collectStarsExampleUrl), "utf8");
  const gameSystemSource = await readFile(new URL("collect-stars-game-system.ts", collectStarsExampleUrl), "utf8");
  const docs = await readFile(new URL("README.md", collectStarsExampleUrl), "utf8");

  assert.equal(index.includes('/examples/main.ts'), true);
  assert.equal(index.includes('?example=collect-stars'), true);
  assert.equal(examplesEntry.includes("bootDodgeBlocksExample"), true);
  assert.equal(examplesEntry.includes("bootCollectStarsExample"), true);
  assert.equal(examplesEntry.includes('"collect-stars"'), true);
  assert.equal(sceneSource.includes("class CollectStarsScene"), true);
  assert.equal(sceneSource.includes("new GameFlow"), true);
  assert.equal(sceneSource.includes("new InputSystem"), true);
  assert.equal(sceneSource.includes("new CollisionSystem"), true);
  assert.equal(sceneSource.includes("instantiateEntityTemplate"), true);
  assert.equal(actionsSource.includes("new InputActionMap"), true);
  assert.equal(actionsSource.includes("defineKeyboardBinding"), true);
  assert.equal(actorsSource.includes("defineActorTemplate"), true);
  assert.equal(actorsSource.includes('collider: { layer: "player" }'), true);
  assert.equal(actorsSource.includes('collider: { layer: "star" }'), true);
  assert.equal(playerControllerSource.includes("limitMovementVector"), true);
  assert.equal(playerControllerSource.includes("clampPositionToBounds"), true);
  assert.equal(gameSystemSource.includes("randomPositionInBounds"), true);
  assert.equal(sceneSource.includes("attachActorSpriteView"), true);
  assert.equal(sceneSource.includes("CollectStarsPlayerController"), true);
  assert.equal(sceneSource.includes("CollectStarsGameSystem"), true);
  assert.equal(sceneSource.includes("createCollectorActorTemplate"), true);
  assert.equal(gameSystemSource.includes("instantiateEntityTemplate"), true);
  assert.equal(gameSystemSource.includes("createStarActorTemplate"), true);
  assert.equal(gameSystemSource.includes("attachActorSpriteView"), true);
  assert.equal(gameSystemSource.includes('collisions?.hasCollision(this.player, "star")'), true);
  assert.equal(gameSystemSource.includes("CollectStarsGameplaySnapshot"), true);
  assert.equal(gameSystemSource.includes("getGameplaySnapshot()"), true);
  assert.equal(gameSystemSource.includes("timeRemainingSeconds"), true);
  assert.equal(gameSystemSource.includes("hasActiveStar"), true);
  assert.equal(sceneSource.includes("getGameplaySnapshot()"), true);
  assert.equal(sceneSource.includes("createHudText"), true);
  assert.equal(sceneSource.includes("createTileMapLayerView"), true);
  assert.equal(bootSource.includes("startSceneWithLifecycle"), true);
  assert.equal(bootSource.includes("BrowserKeyboardBridge"), true);
  assert.equal(bootSource.includes("gameplay: scene.getGameplaySnapshot()"), true);
  assert.equal(docs.includes("`v0.26.4` random position in bounds helper baseline"), true);
  assert.equal(docs.includes("package-style imports"), true);
  assert.equal(docs.includes("使用 `limitMovementVector(...)` 保持斜向移动速度一致"), true);
  assert.equal(docs.includes("将 input actions、player controller、actor templates 和 gameplay system 拆成示例本地模块"), true);
  assert.equal(docs.includes("使用 `defineActorTemplate(...)` 和 `instantiateEntityTemplate(...)` 创建 player/star ECS 数据"), true);
  assert.equal(docs.includes("使用 `attachActorSpriteView(...)` 装配 player/star"), true);
  assert.equal(docs.includes("使用 `randomPositionInBounds(...)` 在 playfield 内生成 star"), true);
  assert.equal(docs.includes("运行时生成 star entity，并通过 `CollisionSystem` 判断收集"), true);
  assert.equal(docs.includes("通过 `getGameplaySnapshot()` 暴露只读 phase"), true);
  assert.equal(docs.includes("`0.25.x` 已经完成第二示例阶段收口"), true);
  assert.equal(docs.includes("`v0.26.2` 对齐了两个 playable examples 的只读 gameplay snapshot 约定"), true);
  assert.equal(docs.includes("`v0.26.3` 把 player/star 重复的 sprite view 装配切到 framework"), true);
  assert.equal(docs.includes("`v0.26.4` 把 star top-left 随机位置计算切到 framework"), true);
  assert.equal(docs.includes("不提供编辑器、示例市场、可视化 launcher"), true);
});

test("pour-sort example playable loop is routed and package-facing", async () => {
  const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const examplesEntry = await readFile(new URL("main.ts", examplesRootUrl), "utf8");
  const sceneSource = await readFile(new URL("pour-sort-scene.ts", pourSortExampleUrl), "utf8");
  const bootSource = await readFile(new URL("boot.ts", pourSortExampleUrl), "utf8");
  const docs = await readFile(new URL("README.md", pourSortExampleUrl), "utf8");

  assert.equal(index.includes("?example=pour-sort"), true);
  assert.equal(index.includes("Pour Sort Shell"), true);
  assert.equal(examplesEntry.includes("bootPourSortExample"), true);
  assert.equal(examplesEntry.includes('"pour-sort"'), true);
  assert.equal(sceneSource.includes("class PourSortScene"), true);
  assert.equal(sceneSource.includes("new InputSystem"), true);
  assert.equal(sceneSource.includes("pickTopEntityAtPoint"), true);
  assert.equal(sceneSource.includes("createSourceTargetSelectionState"), true);
  assert.equal(sceneSource.includes("selectSourceTargetSource"), true);
  assert.equal(sceneSource.includes("selectSourceTargetTarget"), true);
  assert.equal(sceneSource.includes("getGameplaySnapshot"), true);
  assert.equal(sceneSource.includes("pourTopColor"), true);
  assert.equal(sceneSource.includes("isPourSortSolved"), true);
  assert.equal(sceneSource.includes("renderLiquids"), true);
  assert.equal(sceneSource.includes("puzzlePhase"), true);
  assert.equal(sceneSource.includes("moves"), true);
  assert.equal(bootSource.includes("BrowserPointerPositionBridge"), true);
  assert.equal(bootSource.includes("BrowserPointerButtonBridge"), true);
  assert.equal(bootSource.includes("getBoundingClientRect"), true);
  assert.equal(docs.includes("pointer-first puzzle example"), true);
  assert.equal(docs.includes("validate simple top-color pours in example-owned code"), true);
  assert.equal(docs.includes("render liquid color segments"), true);
  assert.equal(docs.includes("exact puzzle rules stay example-owned"), true);
  assert.equal(docs.includes("visual editor selection handles"), true);
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

test("playable examples consume shared bounded movement helper", async () => {
  const dodgePlayer = await readFile(new URL("player-controller.ts", dodgeBlocksExampleUrl), "utf8");
  const dodgeGameSystem = await readFile(new URL("dodge-game-system.ts", dodgeBlocksExampleUrl), "utf8");
  const collectPlayer = await readFile(new URL("player-controller.ts", collectStarsExampleUrl), "utf8");

  assert.equal(dodgePlayer.includes("clampPositionToBounds"), true);
  assert.equal(dodgeGameSystem.includes("clampPositionToBounds"), true);
  assert.equal(collectPlayer.includes("clampPositionToBounds"), true);
  assert.equal(dodgePlayer.includes("function clamp("), false);
  assert.equal(dodgeGameSystem.includes("function clamp("), false);
  assert.equal(collectPlayer.includes("function clamp("), false);
});

test("playable examples keep gameplay snapshots example-owned and read-only", async () => {
  const dodgeGameSystem = await readFile(new URL("dodge-game-system.ts", dodgeBlocksExampleUrl), "utf8");
  const collectScene = await readFile(new URL("collect-stars-scene.ts", collectStarsExampleUrl), "utf8");
  const collectGameSystem = await readFile(new URL("collect-stars-game-system.ts", collectStarsExampleUrl), "utf8");
  const collectBoot = await readFile(new URL("boot.ts", collectStarsExampleUrl), "utf8");
  const pourSortScene = await readFile(new URL("pour-sort-scene.ts", pourSortExampleUrl), "utf8");
  const pourSortBoot = await readFile(new URL("boot.ts", pourSortExampleUrl), "utf8");

  assert.equal(dodgeGameSystem.includes("export type DodgeGameplaySnapshot"), true);
  assert.equal(dodgeGameSystem.includes("getGameplaySnapshot(): DodgeGameplaySnapshot"), true);
  assert.equal(collectGameSystem.includes("export type CollectStarsGameplaySnapshot"), true);
  assert.equal(collectGameSystem.includes("getGameplaySnapshot(): CollectStarsGameplaySnapshot"), true);
  assert.equal(collectScene.includes("getGameplaySnapshot(): CollectStarsGameplaySnapshot | undefined"), true);
  assert.equal(collectBoot.includes("gameplay: scene.getGameplaySnapshot()"), true);
  assert.equal(pourSortScene.includes("export type PourSortGameplaySnapshot"), true);
  assert.equal(pourSortScene.includes("getGameplaySnapshot(): PourSortGameplaySnapshot"), true);
  assert.equal(pourSortScene.includes("puzzlePhase"), true);
  assert.equal(pourSortScene.includes("selectionPhase"), true);
  assert.equal(pourSortBoot.includes("gameplay: scene.getGameplaySnapshot()"), true);
  assert.equal(collectGameSystem.includes("setGameplaySnapshot"), false);
  assert.equal(collectScene.includes("setGameplaySnapshot"), false);
  assert.equal(pourSortScene.includes("setGameplaySnapshot"), false);
});

test("playable examples consume shared actor sprite view attachment helper", async () => {
  const dodgeScene = await readFile(new URL("dodge-blocks-scene.ts", dodgeBlocksExampleUrl), "utf8");
  const dodgeFactory = await readFile(new URL("factories.ts", dodgeBlocksExampleUrl), "utf8");
  const dodgeDocs = await readFile(new URL("README.md", dodgeBlocksExampleUrl), "utf8");
  const collectScene = await readFile(new URL("collect-stars-scene.ts", collectStarsExampleUrl), "utf8");
  const collectGameSystem = await readFile(new URL("collect-stars-game-system.ts", collectStarsExampleUrl), "utf8");

  assert.equal(dodgeScene.includes("attachActorSpriteView"), true);
  assert.equal(dodgeFactory.includes("attachActorSpriteView"), true);
  assert.equal(collectScene.includes("attachActorSpriteView"), true);
  assert.equal(collectGameSystem.includes("attachActorSpriteView"), true);
  assert.equal(dodgeScene.includes("new ViewComponent"), false);
  assert.equal(dodgeFactory.includes("new ViewComponent"), false);
  assert.equal(collectScene.includes("new ViewComponent"), false);
  assert.equal(collectGameSystem.includes("new ViewComponent"), false);
  assert.equal(dodgeDocs.includes("actor sprite view helper"), true);
  assert.equal(dodgeDocs.includes("attachActorSpriteView(...)"), true);
});

test("playable examples consume shared random position in bounds helper", async () => {
  const dodgeGameSystem = await readFile(new URL("dodge-game-system.ts", dodgeBlocksExampleUrl), "utf8");
  const dodgeDocs = await readFile(new URL("README.md", dodgeBlocksExampleUrl), "utf8");
  const collectGameSystem = await readFile(new URL("collect-stars-game-system.ts", collectStarsExampleUrl), "utf8");
  const collectDocs = await readFile(new URL("README.md", collectStarsExampleUrl), "utf8");

  assert.equal(dodgeGameSystem.includes("randomPositionInBounds"), true);
  assert.equal(collectGameSystem.includes("randomPositionInBounds"), true);
  assert.equal(dodgeDocs.includes("randomPositionInBounds(...)"), true);
  assert.equal(collectDocs.includes("randomPositionInBounds(...)"), true);
  assert.equal(dodgeGameSystem.includes("randomBetween(minX, maxX)"), false);
  assert.equal(collectGameSystem.includes("randomBetween("), false);
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

test("dodge-blocks example exposes a read-only gameplay snapshot for playable closeout", async () => {
  const gameplaySource = await readFile(new URL("dodge-game-system.ts", dodgeBlocksExampleUrl), "utf8");
  const bootSource = await readFile(new URL("boot.ts", dodgeBlocksExampleUrl), "utf8");
  const docs = await readFile(new URL("README.md", dodgeBlocksExampleUrl), "utf8");

  assert.equal(gameplaySource.includes("export type DodgeGameplaySnapshot"), true);
  assert.equal(gameplaySource.includes("getGameplaySnapshot()"), true);
  assert.equal(gameplaySource.includes("phase: this.flow.getPhase()"), true);
  assert.equal(gameplaySource.includes("score: this.getScore()"), true);
  assert.equal(gameplaySource.includes("bestScore: this.bestScore"), true);
  assert.equal(gameplaySource.includes("survivalTimeSeconds: this.survivalTime"), true);
  assert.equal(gameplaySource.includes("hazardCount: this.hazards.size"), true);
  assert.equal(gameplaySource.includes("isGameplayActive: this.isGameplayActive()"), true);
  assert.equal(bootSource.includes("gameSystem.getGameplaySnapshot()"), true);
  assert.equal(docs.includes("getGameplaySnapshot()"), true);
  assert.equal(docs.includes("不提供运行时修改入口"), true);
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
  assert.equal(source.includes("createTileMapLayerView"), true);
  assert.equal(docs.includes("level.tileMap"), true);
  assert.equal(docs.includes("level.layout"), true);
  assert.equal(docs.includes("不会把 level/map 声明变成编辑器、地图编辑器、tileset 管理器或自动生成器"), true);
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
