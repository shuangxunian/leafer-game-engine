import { Scene, System } from "@shuangxunian/leafer-game-engine/core";
import type { RenderAdapter, RenderScene, RenderText } from "@shuangxunian/leafer-game-engine/adapter";
import type {
  DialogueChoiceState,
  DialoguePrompt,
  DialoguePromptView,
  GameFlowPhase,
  InputActionMap
} from "@shuangxunian/leafer-game-engine/framework";
import {
  GameFlow,
  InputSystem,
  clearDialogueChoiceSelection,
  createDialogueChoiceState,
  createDialoguePromptView,
  createHudText,
  createSceneRuntimePreset,
  defineDialoguePrompt,
  getDialogueChoiceStateSnapshot,
  resolveDialogueChoiceSelection,
  selectDialogueChoice
} from "@shuangxunian/leafer-game-engine/framework";
import {
  DIALOGUE_INPUT_ACTION,
  createDialogueChoiceInputActions
} from "./input-actions.js";

const PROMPT_X = 48;
const PROMPT_Y_OFFSET = 188;
const CHOICE_Y_OFFSET = 128;
const CHOICE_GAP = 34;

type DialoguePromptId = "opening" | "arcade-loop" | "puzzle-beat" | "narrative-beat" | "ending";

const DIALOGUE_PROMPTS: Record<DialoguePromptId, DialoguePrompt> = {
  "opening": defineDialoguePrompt({
    line: {
      id: "opening",
      speaker: "Mira",
      text: "The demo scene is ready. Which path should this prototype try first?"
    },
    choices: [
      {
        id: "arcade",
        label: "Build a 4399-style loop",
        nextId: "arcade-loop"
      },
      {
        id: "puzzle",
        label: "Try a tap-first puzzle beat",
        nextId: "puzzle-beat"
      },
      {
        id: "narrative",
        label: "Stay with the dialogue flow",
        nextId: "narrative-beat"
      }
    ]
  }),
  "arcade-loop": defineDialoguePrompt({
    line: {
      id: "arcade-loop",
      speaker: "Mira",
      text: "Arcade flow picked. The engine keeps the loop primitives, while this example owns the beat."
    },
    choices: [
      {
        id: "ship",
        label: "Mark this branch complete",
        nextId: "ending"
      },
      {
        id: "back",
        label: "Try another opening choice",
        nextId: "opening"
      }
    ]
  }),
  "puzzle-beat": defineDialoguePrompt({
    line: {
      id: "puzzle-beat",
      speaker: "Mira",
      text: "Puzzle beat picked. Pointer rules and win checks still belong to the downstream game."
    },
    choices: [
      {
        id: "finish",
        label: "Resolve the puzzle branch",
        nextId: "ending"
      },
      {
        id: "back",
        label: "Return to the first prompt",
        nextId: "opening"
      }
    ]
  }),
  "narrative-beat": defineDialoguePrompt({
    line: {
      id: "narrative-beat",
      speaker: "Mira",
      text: "Narrative flow picked. The package helped present choices; the example owns what they mean."
    },
    choices: [
      {
        id: "finish",
        label: "Close the narrative beat",
        nextId: "ending"
      },
      {
        id: "back",
        label: "Return to the first prompt",
        nextId: "opening"
      }
    ]
  }),
  "ending": defineDialoguePrompt({
    line: {
      id: "ending",
      speaker: "Mira",
      text: "Flow complete. This is enough to prove a small playable dialogue path."
    }
  })
};

export type DialogueChoiceGameplaySnapshot = Readonly<{
  flowPhase: GameFlowPhase;
  currentPromptId: string;
  promptId: string;
  choiceIds: readonly string[];
  visitedPromptIds: readonly string[];
  focusedChoiceId?: string;
  selectedChoiceId?: string;
  resolvedChoiceId?: string;
  resolvedNextId?: string;
  lastResolvedChoiceId?: string;
  lastResolvedNextId?: string;
  isResolved: boolean;
  isComplete: boolean;
}>;

export class DialogueChoiceScene extends Scene {
  private readonly flow = new GameFlow({ initialPhase: "ready" });
  private readonly inputActions = createDialogueChoiceInputActions();
  private currentPromptId: DialoguePromptId = "opening";
  private choiceState: DialogueChoiceState = createDialogueChoiceState(this.currentPrompt);
  private focusedChoiceIndex = 0;
  private visitedPromptIds: readonly DialoguePromptId[] = ["opening"];
  private lastResolvedChoiceId?: string;
  private lastResolvedNextId?: string;
  private isComplete = false;
  private promptView?: DialoguePromptView;
  private focusNode?: RenderText;
  private statusNode?: RenderText;

  constructor(
    private readonly renderAdapter: RenderAdapter,
    private readonly renderScene: RenderScene
  ) {
    super("DialogueChoiceScene");
  }

  getGameplaySnapshot(): DialogueChoiceGameplaySnapshot {
    const state = getDialogueChoiceStateSnapshot(this.choiceState);
    const focusedChoice = state.prompt.choices[this.focusedChoiceIndex];

    return {
      flowPhase: this.flow.getPhase(),
      currentPromptId: this.currentPromptId,
      promptId: state.prompt.line.id,
      choiceIds: state.prompt.choices.map((choice) => choice.id),
      visitedPromptIds: [...this.visitedPromptIds],
      focusedChoiceId: focusedChoice?.id,
      selectedChoiceId: state.selectedChoiceId,
      resolvedChoiceId: state.resolvedChoice?.id,
      resolvedNextId: state.resolvedChoice?.nextId,
      lastResolvedChoiceId: this.lastResolvedChoiceId,
      lastResolvedNextId: this.lastResolvedNextId,
      isResolved: state.isResolved,
      isComplete: this.isComplete
    };
  }

  protected onStart(): void {
    createSceneRuntimePreset(this, { input: true });
    this.flow.start();
    this.createStage();
    this.createPromptView();
    this.addSystem(new DialogueChoiceShellSystem(this, this.inputActions, this));
    this.syncHud();
  }

  override destroy(): void {
    super.destroy();
    this.renderScene.destroy();
  }

  moveChoiceFocus(delta: number): void {
    if (this.isComplete) return;
    const choiceCount = this.currentPrompt.choices.length;
    if (choiceCount === 0) return;

    this.focusedChoiceIndex = (this.focusedChoiceIndex + delta + choiceCount) % choiceCount;
    this.syncHud();
  }

  confirmFocusedChoice(): void {
    if (this.isComplete) return;
    const choice = this.currentPrompt.choices[this.focusedChoiceIndex];
    if (!choice) return;

    const selected = selectDialogueChoice(this.choiceState, choice.id);
    this.choiceState = resolveDialogueChoiceSelection(selected);
    const snapshot = getDialogueChoiceStateSnapshot(this.choiceState);
    const nextPromptId = getDialoguePromptId(snapshot.resolvedChoice?.nextId);
    this.lastResolvedChoiceId = snapshot.resolvedChoice?.id;
    this.lastResolvedNextId = snapshot.resolvedChoice?.nextId;

    if (!nextPromptId) {
      this.completeFlow();
      return;
    }

    this.setCurrentPrompt(nextPromptId);
    this.syncHud();
  }

  resetPrompt(): void {
    this.currentPromptId = "opening";
    this.choiceState = clearDialogueChoiceSelection(createDialogueChoiceState(this.currentPrompt));
    this.focusedChoiceIndex = 0;
    this.visitedPromptIds = ["opening"];
    this.lastResolvedChoiceId = undefined;
    this.lastResolvedNextId = undefined;
    this.isComplete = false;
    this.promptView?.setPrompt(this.currentPrompt);
    this.flow.reset();
    this.flow.start();
    this.syncHud();
  }

  private get currentPrompt(): DialoguePrompt {
    return DIALOGUE_PROMPTS[this.currentPromptId];
  }

  private createStage(): void {
    const background = this.renderAdapter.createSprite();
    background.setAsset({
      id: "dialogue-choice-background",
      fill: "#152235",
      width: this.renderScene.width,
      height: this.renderScene.height,
      cornerRadius: 0
    });
    background.x = 0;
    background.y = 0;
    this.renderScene.layers.background.addChild(background);

    const character = this.renderAdapter.createSprite();
    character.setAsset({
      id: "dialogue-choice-character",
      fill: "#f0b86c",
      width: 124,
      height: 184,
      cornerRadius: 24
    });
    character.x = Math.max(40, this.renderScene.width - 190);
    character.y = Math.max(96, this.renderScene.height - 330);
    this.renderScene.layers.world.addChild(character);

    const promptPanel = this.renderAdapter.createSprite();
    promptPanel.setAsset({
      id: "dialogue-choice-prompt-panel",
      fill: "#24364d",
      width: Math.max(320, this.renderScene.width - 64),
      height: 164,
      cornerRadius: 18
    });
    promptPanel.x = 32;
    promptPanel.y = Math.max(120, this.renderScene.height - PROMPT_Y_OFFSET - 20);
    this.renderScene.layers.ui.addChild(promptPanel);

    createHudText(this.renderAdapter, this.renderScene, {
      text: "Dialogue Choice Shell",
      x: 32,
      y: 24,
      fontSize: 30
    });
    this.statusNode = createHudText(this.renderAdapter, this.renderScene, {
      text: "",
      x: 32,
      y: 64,
      fontSize: 17
    });
  }

  private createPromptView(): void {
    const promptY = Math.max(132, this.renderScene.height - PROMPT_Y_OFFSET);
    const choiceStartY = Math.max(182, this.renderScene.height - CHOICE_Y_OFFSET);
    this.promptView = createDialoguePromptView(this.renderAdapter, this.renderScene, {
      prompt: this.currentPrompt,
      x: PROMPT_X,
      y: promptY,
      choiceStartY,
      choiceGap: CHOICE_GAP,
      lineFontSize: 20,
      choiceFontSize: 18,
      layer: "overlay"
    });
    this.focusNode = createHudText(this.renderAdapter, this.renderScene, {
      text: ">",
      x: PROMPT_X - 22,
      y: choiceStartY,
      fontSize: 20,
      layer: "overlay"
    });
  }

  private syncHud(): void {
    const snapshot = this.getGameplaySnapshot();
    const choiceStartY = Math.max(182, this.renderScene.height - CHOICE_Y_OFFSET);

    if (this.focusNode) {
      this.focusNode.visible = !snapshot.isComplete && snapshot.choiceIds.length > 0;
      this.focusNode.y = choiceStartY + this.focusedChoiceIndex * CHOICE_GAP;
    }

    if (!this.statusNode) return;

    if (snapshot.isComplete) {
      this.statusNode.setText(`Reached ${snapshot.currentPromptId}. Press R to restart the dialogue flow.`);
      return;
    }

    if (snapshot.lastResolvedChoiceId) {
      this.statusNode.setText(
        `Last choice ${snapshot.lastResolvedChoiceId} -> ${snapshot.lastResolvedNextId ?? "no next id"}. Continue choosing.`
      );
      return;
    }

    this.statusNode.setText("Use W/S or arrow keys to focus a choice, Enter/Space to resolve it.");
  }

  private setCurrentPrompt(promptId: DialoguePromptId): void {
    this.currentPromptId = promptId;
    this.choiceState = createDialogueChoiceState(this.currentPrompt);
    this.focusedChoiceIndex = 0;
    this.visitedPromptIds = [...this.visitedPromptIds, promptId];
    this.promptView?.setPrompt(this.currentPrompt);

    if (this.currentPrompt.choices.length === 0) {
      this.completeFlow();
    }
  }

  private completeFlow(): void {
    this.isComplete = true;
    this.flow.end();
    this.syncHud();
  }
}

class DialogueChoiceShellSystem extends System {
  override priority = 60;

  constructor(
    scene: Scene,
    private readonly inputActions: InputActionMap,
    private readonly controller: Pick<DialogueChoiceScene, "moveChoiceFocus" | "confirmFocusedChoice" | "resetPrompt">
  ) {
    super(scene);
  }

  override update(): void {
    const input = this.scene.getSystem(InputSystem);
    if (!input) return;

    if (this.inputActions.wasPressed(input, DIALOGUE_INPUT_ACTION.PreviousChoice)) {
      this.controller.moveChoiceFocus(-1);
    }

    if (this.inputActions.wasPressed(input, DIALOGUE_INPUT_ACTION.NextChoice)) {
      this.controller.moveChoiceFocus(1);
    }

    if (this.inputActions.wasPressed(input, DIALOGUE_INPUT_ACTION.ConfirmChoice)) {
      this.controller.confirmFocusedChoice();
    }

    if (this.inputActions.wasPressed(input, DIALOGUE_INPUT_ACTION.ResetPrompt)) {
      this.controller.resetPrompt();
    }
  }
}

function getDialoguePromptId(value: string | undefined): DialoguePromptId | undefined {
  if (value === undefined) return undefined;
  if (value in DIALOGUE_PROMPTS) return value as DialoguePromptId;
  return undefined;
}
