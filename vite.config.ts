import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const sourceEntry = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@shuangxunian/leafer-game-engine/adapter",
        replacement: sourceEntry("./src/adapter/index.ts")
      },
      {
        find: "@shuangxunian/leafer-game-engine/core",
        replacement: sourceEntry("./src/core/index.ts")
      },
      {
        find: "@shuangxunian/leafer-game-engine/framework",
        replacement: sourceEntry("./src/framework/index.ts")
      },
      {
        find: "@shuangxunian/leafer-game-engine/runtime",
        replacement: sourceEntry("./src/runtime/index.ts")
      },
      {
        find: "@shuangxunian/leafer-game-engine/tooling",
        replacement: sourceEntry("./src/tooling/index.ts")
      },
      {
        find: "@shuangxunian/leafer-game-engine",
        replacement: sourceEntry("./src/engine.ts")
      }
    ]
  }
});
