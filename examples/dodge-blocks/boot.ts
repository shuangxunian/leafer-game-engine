import type { BrowserRuntime } from "@shuangxunian/leafer-game-engine/runtime";
import { BrowserAudioPlaybackAdapter, startSceneWithLifecycle } from "@shuangxunian/leafer-game-engine/runtime";
import {
  InputSystem,
  addAudioPlayback,
  getAudioRuntime,
  createDefaultComponentSchemaRegistry,
  createSceneInputBridgeBundle
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

  const inputBridges = createSceneInputBridgeBundle(scene, {
    keyboard: true,
    pointerButtons: true,
    detachOnSceneDestroy: false
  });
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
    inputBridges.detach();
    destroyScene();
  };

  console.log("Example assets loaded:", lifecycleResult.prepareResult);
  console.log("Example bootstrapped:", {
    tooling: createSnapshot(),
    gameplay: gameSystem.getGameplaySnapshot()
  });
}
