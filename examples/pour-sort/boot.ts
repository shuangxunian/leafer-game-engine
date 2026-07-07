import type { BrowserRuntime } from "@shuangxunian/leafer-game-engine/runtime";
import { startSceneWithLifecycle } from "@shuangxunian/leafer-game-engine/runtime";
import { createSceneInputBridgeBundle } from "@shuangxunian/leafer-game-engine/framework";
import { PourSortScene } from "./pour-sort-scene.js";

export async function bootPourSortExample(runtime: BrowserRuntime): Promise<void> {
  const scene = new PourSortScene(runtime.renderAdapter, runtime.renderScene);
  const lifecycleResult = await startSceneWithLifecycle({
    scene,
    start: (readyScene) => runtime.start(readyScene)
  });
  if (!lifecycleResult.ok) {
    throw lifecycleResult.error;
  }

  const target = document.getElementById("game-root");
  if (!target) throw new Error("Pour-sort mount target was not found.");

  createSceneInputBridgeBundle(scene, {
    pointerButtons: { target },
    pointerPosition: { target, localTarget: target }
  });

  console.log("Pour Sort shell bootstrapped:", {
    gameplay: scene.getGameplaySnapshot()
  });
}
