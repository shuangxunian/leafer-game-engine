import type { BrowserRuntime } from "@shuangxunian/leafer-game-engine/runtime";
import { startSceneWithLifecycle } from "@shuangxunian/leafer-game-engine/runtime";
import {
  BrowserPointerButtonBridge,
  BrowserPointerPositionBridge,
  InputSystem
} from "@shuangxunian/leafer-game-engine/framework";
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

  const input = scene.getSystem(InputSystem);
  if (!input) throw new Error("InputSystem was not initialized.");

  const target = document.getElementById("game-root");
  if (!target) throw new Error("Pour-sort mount target was not found.");

  const pointerPosition = new BrowserPointerPositionBridge(input, target, (event) => {
    const pointerEvent = event as { clientX?: unknown; clientY?: unknown };
    if (typeof pointerEvent.clientX !== "number" || typeof pointerEvent.clientY !== "number") {
      return undefined;
    }

    const rect = target.getBoundingClientRect();
    return {
      x: pointerEvent.clientX - rect.left,
      y: pointerEvent.clientY - rect.top
    };
  });
  const pointerButton = new BrowserPointerButtonBridge(input, target);
  pointerPosition.attach();
  pointerButton.attach();

  const destroyScene = scene.destroy.bind(scene);
  scene.destroy = (): void => {
    pointerPosition.detach();
    pointerButton.detach();
    destroyScene();
  };

  console.log("Pour Sort shell bootstrapped:", {
    gameplay: scene.getGameplaySnapshot()
  });
}
