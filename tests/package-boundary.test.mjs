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
    "README.md",
    "LICENSE"
  ]);
});

test("core package subpath can be imported by package name in Node", async () => {
  const core = await import(`${packageJson.name}/core`);

  assertExports(core, ["Component", "Entity", "Game", "Scene", "System", "Time", "World"]);
});

test("framework package subpath can be imported by package name in Node", async () => {
  const framework = await import(`${packageJson.name}/framework`);

  assertExports(framework, [
    "AssetRegistry",
    "CameraSystem",
    "CollisionSystem",
    "EventBus",
    "GameFlow",
    "InputSystem",
    "RuntimeScheduler",
    "SpriteAnimationComponent",
    "SpriteAnimationSystem",
    "StateMachine",
    "TransformComponent",
    "ViewComponent",
    "advanceSpriteAnimationPlayback",
    "createSpriteAnimationPlayback",
    "createDefaultComponentSchemaRegistry",
    "defineSpriteAnimationClip",
    "defineSpriteFrame",
    "getSpriteAnimationPlaybackFrameId",
    "getSpriteAnimationPlaybackFrameIndex",
    "loadAssetManifestAsync"
  ]);
});

test("tooling package subpath can be imported by package name in Node", async () => {
  const tooling = await import(`${packageJson.name}/tooling`);

  assertExports(tooling, [
    "createDebugSnapshot",
    "createSpriteAnimationSnapshot",
    "createSpriteAnimationsPanelSection",
    "createToolingSnapshot",
    "createToolingPanelSections",
    "formatDebugSnapshot",
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
