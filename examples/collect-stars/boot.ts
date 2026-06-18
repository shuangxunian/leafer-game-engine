import type { BrowserRuntime } from "@shuangxunian/leafer-game-engine/runtime";
import { startSceneWithLifecycle } from "@shuangxunian/leafer-game-engine/runtime";
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

  console.log("Collect Stars shell bootstrapped:", {
    phase: scene.gameFlow.getPhase()
  });
}
