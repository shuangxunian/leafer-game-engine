import type { BrowserRuntime } from "../../src/runtime/index.js";
import { BrowserKeyboardBridge, InputSystem } from "../../src/framework/index.js";
import { DodgeBlocksScene } from "./dodge-blocks-scene.js";
import { BrowserToolingPanel, createToolingSnapshot } from "../../src/tooling/index.js";

export function bootDodgeBlocksExample(runtime: BrowserRuntime): void {
  const scene = new DodgeBlocksScene(runtime.renderAdapter, runtime.renderScene);
  runtime.start(scene);

  const input = scene.getSystem(InputSystem);
  if (!input) throw new Error("InputSystem was not initialized.");

  const keyboard = new BrowserKeyboardBridge(input);
  keyboard.attach();
  const toolingPanel = new BrowserToolingPanel();
  const createSnapshot = () =>
    createToolingSnapshot(scene, {
      assets: scene.assetRegistry,
      game: runtime.game,
      inspector: true,
      renderScene: runtime.renderScene
    });
  toolingPanel.update(createSnapshot());
  const toolingTimer = window.setInterval(() => {
    toolingPanel.update(createSnapshot());
  }, 250);

  const destroyScene = scene.destroy.bind(scene);
  scene.destroy = (): void => {
    window.clearInterval(toolingTimer);
    toolingPanel.detach();
    keyboard.detach();
    destroyScene();
  };

  console.log("Example bootstrapped:", createSnapshot());
}
