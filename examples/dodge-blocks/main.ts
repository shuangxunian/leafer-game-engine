import { createBrowserRuntime } from "@shuangxunian/leafer-game-engine";
import { bootDodgeBlocksExample } from "./boot.js";
import "./styles.css";

const runtime = createBrowserRuntime({
  mount: "game-root"
});

bootDodgeBlocksExample(runtime).catch((error: unknown) => {
  console.error("Failed to boot dodge-blocks example:", error);
});
