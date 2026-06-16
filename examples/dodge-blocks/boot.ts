import type { BrowserRuntime } from "../../src/runtime/index.js";
import { BrowserKeyboardBridge, InputSystem } from "../../src/framework/index.js";
import { DodgeBlocksScene } from "./dodge-blocks-scene.js";
import { BrowserDebugOverlay, createDebugSnapshot } from "../../src/tooling/index.js";

export function bootDodgeBlocksExample(runtime: BrowserRuntime): void {
  const scene = new DodgeBlocksScene(runtime.renderAdapter, runtime.renderScene);
  runtime.start(scene);

  const input = scene.getSystem(InputSystem);
  if (!input) throw new Error("InputSystem was not initialized.");

  const keyboard = new BrowserKeyboardBridge(input);
  keyboard.attach();
  const debugOverlay = new BrowserDebugOverlay();
  const createSnapshot = () =>
    createDebugSnapshot(scene, {
      assets: scene.assetRegistry,
      game: runtime.game,
      renderScene: runtime.renderScene
    });
  debugOverlay.update(createSnapshot());
  const debugTimer = window.setInterval(() => {
    debugOverlay.update(createSnapshot());
  }, 250);

  const destroyScene = scene.destroy.bind(scene);
  scene.destroy = (): void => {
    window.clearInterval(debugTimer);
    debugOverlay.detach();
    keyboard.detach();
    destroyScene();
  };

  console.log("Example bootstrapped:", createSnapshot());
}
