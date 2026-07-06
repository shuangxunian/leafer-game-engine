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

const OPENING_PROMPT = defineDialoguePrompt({
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
});

export type DialogueChoiceGameplaySnapshot = Readonly<{
  flowPhase: GameFlowPhase;
  promptId: string;
  choiceIds: readonly string[];
  focusedChoiceId?: string;
  selectedChoiceId?: string;
  resolvedChoiceId?: string;
  resolvedNextId?: string;
  isResolved: boolean;
}>;

export class DialogueChoiceScene extends Scene {
  private readonly flow = new GameFlow({ initialPhase: "ready" });
  private readonly inputActions = createDialogueChoiceInputActions();
  private readonly prompt = OPENING_PROMPT;
  private choiceState: DialogueChoiceState = createDialogueChoiceState(this.prompt);
  private focusedChoiceIndex = 0;
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
      promptId: state.prompt.line.id,
      choiceIds: state.prompt.choices.map((choice) => choice.id),
      focusedChoiceId: focusedChoice?.id,
      selectedChoiceId: state.selectedChoiceId,
      resolvedChoiceId: state.resolvedChoice?.id,
      resolvedNextId: state.resolvedChoice?.nextId,
      isResolved: state.isResolved
    };
  }

  protected onStart(): void {
    this.addSystem(new InputSystem(this));
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
    if (this.flow.is("ended")) return;
    const choiceCount = this.prompt.choices.length;
    if (choiceCount === 0) return;

    this.focusedChoiceIndex = (this.focusedChoiceIndex + delta + choiceCount) % choiceCount;
    this.syncHud();
  }

  confirmFocusedChoice(): void {
    if (this.flow.is("ended")) return;
    const choice = this.prompt.choices[this.focusedChoiceIndex];
    if (!choice) return;

    const selected = selectDialogueChoice(this.choiceState, choice.id);
    this.choiceState = resolveDialogueChoiceSelection(selected);
    this.flow.end();
    this.syncHud();
  }

  resetPrompt(): void {
    this.choiceState = clearDialogueChoiceSelection(this.choiceState);
    this.focusedChoiceIndex = 0;
    this.flow.reset();
    this.flow.start();
    this.syncHud();
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
      prompt: this.prompt,
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
      this.focusNode.visible = !snapshot.isResolved;
      this.focusNode.y = choiceStartY + this.focusedChoiceIndex * CHOICE_GAP;
    }

    if (!this.statusNode) return;

    if (snapshot.resolvedChoiceId) {
      this.statusNode.setText(
        `Resolved ${snapshot.resolvedChoiceId} -> ${snapshot.resolvedNextId ?? "no next id"}. Press R to reset.`
      );
      return;
    }

    this.statusNode.setText("Use W/S or arrow keys to focus a choice, Enter/Space to resolve it.");
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
