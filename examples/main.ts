import { createBrowserRuntime } from "@shuangxunian/leafer-game-engine";
import type { BrowserRuntime } from "@shuangxunian/leafer-game-engine/runtime";
import { bootCollectStarsExample } from "./collect-stars/boot.js";
import { bootDialogueChoiceExample } from "./dialogue-choice/boot.js";
import { bootDodgeBlocksExample } from "./dodge-blocks/boot.js";
import { bootPourSortExample } from "./pour-sort/boot.js";
import "./styles.css";

type ExampleId = "dodge-blocks" | "collect-stars" | "pour-sort" | "dialogue-choice";

type ExampleRoute = {
  id: ExampleId;
  title: string;
  hint: string;
  boot: (runtime: BrowserRuntime) => Promise<void>;
};

const EXAMPLES: Record<ExampleId, ExampleRoute> = {
  "dodge-blocks": {
    id: "dodge-blocks",
    title: "Dodge Blocks Playground",
    hint: "Playable falling-block dodge loop that consumes the engine package as a downstream browser game.",
    boot: bootDodgeBlocksExample
  },
  "collect-stars": {
    id: "collect-stars",
    title: "Collect Stars Shell",
    hint: "Second example shell for the 0.25.x reuse sprint. Gameplay loop lands after this routing baseline.",
    boot: bootCollectStarsExample
  },
  "pour-sort": {
    id: "pour-sort",
    title: "Pour Sort Shell",
    hint: "Pointer-first puzzle shell that validates local pointer coordinates, entity picking, and source-target selection.",
    boot: bootPourSortExample
  },
  "dialogue-choice": {
    id: "dialogue-choice",
    title: "Dialogue Choice Shell",
    hint: "Narrative UI shell that validates dialogue prompt data, choice state, prompt rendering, and keyboard action consumption.",
    boot: bootDialogueChoiceExample
  }
};

const selectedExample = resolveExampleId(new URLSearchParams(window.location.search).get("example"));
const route = EXAMPLES[selectedExample];

document.title = `leaferGame - ${route.title}`;
setText("example-title", route.title);
setText("example-hint", route.hint);
markCurrentExample(selectedExample);

const runtime = createBrowserRuntime({
  mount: "game-root",
  resize: true
});

route.boot(runtime).catch((error: unknown) => {
  console.error(`Failed to boot ${selectedExample} example:`, error);
});

function resolveExampleId(value: string | null): ExampleId {
  if (value === "collect-stars" || value === "pour-sort" || value === "dialogue-choice") return value;
  return "dodge-blocks";
}

function setText(id: string, text: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
}

function markCurrentExample(exampleId: ExampleId): void {
  document.querySelectorAll<HTMLAnchorElement>("[data-example]").forEach((link) => {
    if (link.dataset.example === exampleId) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}
