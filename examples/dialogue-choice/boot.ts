import type { BrowserRuntime } from "@shuangxunian/leafer-game-engine/runtime";
import { startSceneWithLifecycle } from "@shuangxunian/leafer-game-engine/runtime";
import { createSceneQuickStartBundle } from "@shuangxunian/leafer-game-engine/framework";
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

  createSceneQuickStartBundle(scene, {
    runtime: { input: true },
    inputBridges: { keyboard: true }
  });

  console.log("Dialogue Choice shell bootstrapped:", {
    gameplay: scene.getGameplaySnapshot()
  });
}
