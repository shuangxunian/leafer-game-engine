import { createBrowserRuntime } from "../../src/runtime/index.js";
import { bootDodgeBlocksExample } from "./boot.js";
import "./styles.css";

const runtime = createBrowserRuntime({
  mount: "game-root"
});

bootDodgeBlocksExample(runtime);
