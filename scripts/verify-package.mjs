import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

function fail(message) {
  throw new Error(`Package verification failed: ${message}`);
}

function parsePackJson(output) {
  const jsonStart = output.indexOf("[");
  if (jsonStart < 0) {
    fail("npm pack did not return JSON output");
  }

  return JSON.parse(output.slice(jsonStart));
}

function normalizePackagePath(path) {
  return path.startsWith("./") ? path.slice(2) : path;
}

function collectExportTargets() {
  const targets = [];

  for (const config of Object.values(packageJson.exports)) {
    targets.push(normalizePackagePath(config.import));
    targets.push(normalizePackagePath(config.types));
  }

  return targets;
}

function assertHasFile(files, path) {
  if (!files.has(path)) {
    fail(`missing expected file "${path}"`);
  }
}

function assertMissingPrefix(files, prefix) {
  const found = [...files].find((path) => path === prefix || path.startsWith(`${prefix}/`));
  if (found) {
    fail(`unexpected development-only file "${found}"`);
  }
}

const output = execFileSync("npm", ["pack", "--dry-run", "--json"], {
  cwd: new URL("..", import.meta.url),
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"]
});
const packResult = parsePackJson(output);

if (!Array.isArray(packResult) || packResult.length !== 1) {
  fail("expected exactly one package result from npm pack");
}

const packageFiles = new Set(packResult[0].files.map((file) => file.path));

for (const requiredFile of [
  "package.json",
  "README.md",
  "LICENSE",
  "docs/public-api.md",
  "docs/product-boundary.md",
  "docs/animation-runtime.md",
  "docs/runtime-services.md",
  "docs/input-actions.md",
  "docs/runtime-observability.md",
  "docs/scene-config.md"
]) {
  assertHasFile(packageFiles, requiredFile);
}

for (const target of collectExportTargets()) {
  assertHasFile(packageFiles, target);
}

for (const prefix of ["src", "tests", "examples", "dist", "scripts", "node_modules"]) {
  assertMissingPrefix(packageFiles, prefix);
}

console.log(`Package artifact verified: ${packResult[0].filename} (${packageFiles.size} files)`);
