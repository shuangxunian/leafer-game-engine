import type { Scene } from "../core/index.js";

export type SceneLifecyclePhase = "idle" | "loading" | "ready" | "running" | "failed";

export type SceneLifecycleTransition = {
  from: SceneLifecyclePhase;
  to: SceneLifecyclePhase;
};

export type SceneLifecycleStartOptions<TScene extends Scene, TPrepareResult = void> = {
  scene: TScene;
  prepare?: (scene: TScene) => TPrepareResult | Promise<TPrepareResult>;
  start: (scene: TScene) => void;
  onTransition?: (transition: SceneLifecycleTransition) => void;
};

export type SceneLifecycleStartResult<TScene extends Scene, TPrepareResult = void> =
  | {
      ok: true;
      phase: "running";
      scene: TScene;
      prepareResult: TPrepareResult;
    }
  | {
      ok: false;
      phase: "failed";
      scene: TScene;
      error: unknown;
    };

export async function startSceneWithLifecycle<TScene extends Scene, TPrepareResult = void>(
  options: SceneLifecycleStartOptions<TScene, TPrepareResult>
): Promise<SceneLifecycleStartResult<TScene, TPrepareResult>> {
  let phase: SceneLifecyclePhase = "idle";
  const moveTo = (to: SceneLifecyclePhase): void => {
    if (phase === to) return;

    const from = phase;
    phase = to;
    options.onTransition?.({ from, to });
  };

  try {
    moveTo("loading");
    const prepareResult = options.prepare ? await options.prepare(options.scene) : (undefined as TPrepareResult);
    moveTo("ready");
    options.start(options.scene);
    moveTo("running");

    return {
      ok: true,
      phase: "running",
      scene: options.scene,
      prepareResult
    };
  } catch (error) {
    moveTo("failed");

    return {
      ok: false,
      phase: "failed",
      scene: options.scene,
      error
    };
  }
}
