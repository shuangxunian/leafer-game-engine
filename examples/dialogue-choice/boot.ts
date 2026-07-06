import type { BrowserRuntime } from "@shuangxunian/leafer-game-engine/runtime";
import { startSceneWithLifecycle } from "@shuangxunian/leafer-game-engine/runtime";
import { BrowserKeyboardBridge, InputSystem } from "@shuangxunian/leafer-game-engine/framework";
import { DialogueChoiceScene } from "./dialogue-choice-scene.js";

export async function bootDialogueChoiceExample(runtime: BrowserRuntime): Promise<void> {
  const scene = new DialogueChoiceScene(runtime.renderAdapter, runtime.renderScene);
  const lifecycleResult = await startSceneWithLifecycle({
    scene,
    start: (readyScene) => runtime.start(readyScene)
  });
  if (!lifecycleResult.ok) {
    throw lifecycleResult.error;
  }

  const input = scene.getSystem(InputSystem);
  if (!input) throw new Error("InputSystem was not initialized.");

  const keyboard = new BrowserKeyboardBridge(input);
  keyboard.attach();

  const destroyScene = scene.destroy.bind(scene);
  scene.destroy = (): void => {
    keyboard.detach();
    destroyScene();
  };

  console.log("Dialogue Choice shell bootstrapped:", {
    gameplay: scene.getGameplaySnapshot()
  });
}
