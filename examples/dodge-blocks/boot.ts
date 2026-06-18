import type { BrowserRuntime } from "@shuangxunian/leafer-game-engine/runtime";
import { BrowserAudioPlaybackAdapter, startSceneWithLifecycle } from "@shuangxunian/leafer-game-engine/runtime";
import {
  BrowserKeyboardBridge,
  BrowserPointerButtonBridge,
  InputSystem,
  addAudioPlayback,
  getAudioRuntime,
  createDefaultComponentSchemaRegistry
} from "@shuangxunian/leafer-game-engine/framework";
import { DodgeBlocksScene } from "./dodge-blocks-scene.js";
import { DodgeGameSystem } from "./dodge-game-system.js";
import { BrowserToolingPanel, createToolingSnapshot } from "@shuangxunian/leafer-game-engine/tooling";

export async function bootDodgeBlocksExample(runtime: BrowserRuntime): Promise<void> {
  const scene = new DodgeBlocksScene(runtime.renderAdapter, runtime.renderScene);
  const lifecycleResult = await startSceneWithLifecycle({
    scene,
    prepare: (preparedScene) => preparedScene.preloadAssets(),
    start: (readyScene) => runtime.start(readyScene)
  });
  if (!lifecycleResult.ok) {
    throw lifecycleResult.error;
  }

  const input = scene.getSystem(InputSystem);
  if (!input) throw new Error("InputSystem was not initialized.");
  const gameSystem = scene.getSystem(DodgeGameSystem);
  if (!gameSystem) throw new Error("DodgeGameSystem was not initialized.");
  const audio = getAudioRuntime(scene);
  if (!audio) throw new Error("AudioRuntimeSystem was not initialized.");
  addAudioPlayback(scene, {
    audio,
    adapter: new BrowserAudioPlaybackAdapter({ audio }),
    priority: 260
  });

  const keyboard = new BrowserKeyboardBridge(input);
  keyboard.attach();
  const pointer = new BrowserPointerButtonBridge(input);
  pointer.attach();
  const toolingPanel = new BrowserToolingPanel();
  const schemas = createDefaultComponentSchemaRegistry();
  const createSnapshot = () =>
    createToolingSnapshot(scene, {
      animations: true,
      audio: true,
      assets: scene.assetRegistry,
      collisions: true,
      flow: gameSystem.gameFlow,
      game: runtime.game,
      input,
      inputActions: scene.inputActionMap,
      inspector: true,
      renderScene: runtime.renderScene,
      schemas
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
    pointer.detach();
    destroyScene();
  };

  console.log("Example assets loaded:", lifecycleResult.prepareResult);
  console.log("Example bootstrapped:", {
    tooling: createSnapshot(),
    gameplay: gameSystem.getGameplaySnapshot()
  });
}
