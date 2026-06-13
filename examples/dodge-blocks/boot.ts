import type { BrowserRuntime } from "../../src/runtime/index.js";
import { BrowserKeyboardBridge, InputSystem } from "../../src/framework/index.js";
import { DodgeBlocksScene } from "./dodge-blocks-scene.js";
import { createDebugSnapshot } from "../../src/tooling/debug.js";

export function bootDodgeBlocksExample(runtime: BrowserRuntime): void {
  const scene = new DodgeBlocksScene(runtime.renderAdapter, runtime.renderScene);
  runtime.start(scene);

  const input = scene.getSystem(InputSystem);
  if (!input) throw new Error("InputSystem was not initialized.");

  const keyboard = new BrowserKeyboardBridge(input);
  keyboard.attach();

  const destroyScene = scene.destroy.bind(scene);
  scene.destroy = (): void => {
    keyboard.detach();
    destroyScene();
  };

  console.log("Example bootstrapped:", createDebugSnapshot(scene));
}
