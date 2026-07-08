import type { BrowserRuntime } from "@shuangxunian/leafer-game-engine/runtime";
import { startSceneWithLifecycle } from "@shuangxunian/leafer-game-engine/runtime";
import { createSceneQuickStartBundle } from "@shuangxunian/leafer-game-engine/framework";
import { CollectStarsScene } from "./collect-stars-scene.js";

export async function bootCollectStarsExample(runtime: BrowserRuntime): Promise<void> {
  const scene = new CollectStarsScene(runtime.renderAdapter, runtime.renderScene);
  const lifecycleResult = await startSceneWithLifecycle({
    scene,
    start: (readyScene) => runtime.start(readyScene)
  });
  if (!lifecycleResult.ok) {
    throw lifecycleResult.error;
  }

  createSceneQuickStartBundle(scene, {
    runtime: {
      input: true,
      collisions: true,
      runtimeServices: true
    },
    inputBridges: { keyboard: true }
  });

  console.log("Collect Stars gameplay bootstrapped:", {
    phase: scene.gameFlow.getPhase(),
    gameplay: scene.getGameplaySnapshot()
  });
}
