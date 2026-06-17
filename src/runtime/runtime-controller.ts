import { type Game, type Scene } from "../core/index.js";
import type { AnimationFrameLoop } from "./frame-loop.js";

export type RuntimeControllerOptions = {
  game: Game;
  loop: AnimationFrameLoop;
};

export type RuntimeController = {
  start(scene: Scene): void;
  stop(): void;
};

export function createRuntimeController(options: RuntimeControllerOptions): RuntimeController {
  const { game, loop } = options;

  return {
    start(scene: Scene): void {
      game.setScene(scene);
      loop.reset();
      loop.start();
    },
    stop(): void {
      loop.stop();
    }
  };
}
