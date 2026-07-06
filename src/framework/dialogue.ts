import type { RenderAdapter, RenderScene, RenderSceneLayerName, RenderText } from "../adapter/index.js";
import { createHudText } from "./hud.js";

export type DialogueLine = Readonly<{
  id: string;
  text: string;
  speaker?: string;
}>;

export type DialogueChoice = Readonly<{
  id: string;
  label: string;
  nextId?: string;
}>;

export type DialoguePrompt = Readonly<{
  line: DialogueLine;
  choices: readonly DialogueChoice[];
}>;

export type DialoguePromptSnapshot = DialoguePrompt;

export type DialogueChoiceStatePhase = "empty" | "choice-selected" | "choice-resolved";

export type DialogueChoiceState = Readonly<{
  phase: DialogueChoiceStatePhase;
  prompt: DialoguePrompt;
  selectedChoiceId?: string;
  resolvedChoice?: DialogueChoice;
}>;

export type DialogueChoiceStateSnapshot = Readonly<{
  phase: DialogueChoiceStatePhase;
  prompt: DialoguePromptSnapshot;
  selectedChoiceId?: string;
  resolvedChoice?: DialogueChoice;
  isSelected: boolean;
  isResolved: boolean;
}>;

export type DialoguePromptViewOptions = Readonly<{
  prompt: DialoguePrompt;
  x?: number;
  y?: number;
  choiceStartY?: number;
  choiceGap?: number;
  lineFontSize?: number;
  choiceFontSize?: number;
  visible?: boolean;
  layer?: Extract<RenderSceneLayerName, "ui" | "overlay">;
}>;

export type DialoguePromptView = Readonly<{
  line: RenderText;
  choices: readonly RenderText[];
  setPrompt(prompt: DialoguePrompt): DialoguePromptSnapshot;
  setVisible(visible: boolean): void;
  getPromptSnapshot(): DialoguePromptSnapshot;
  destroy(): void;
}>;

export type DialogueLineInput = Readonly<{
  id: string;
  text: string;
  speaker?: string;
}>;

export type DialogueChoiceInput = Readonly<{
  id: string;
  label: string;
  nextId?: string;
}>;

export type DialoguePromptInput = Readonly<{
  line: DialogueLineInput;
  choices?: readonly DialogueChoiceInput[];
}>;

export function defineDialogueLine(input: DialogueLineInput): DialogueLine {
  const line: DialogueLine = {
    id: readNonEmptyString(input.id, "Dialogue line id"),
    text: readNonEmptyString(input.text, "Dialogue line text")
  };

  if (input.speaker === undefined) return line;

  return {
    ...line,
    speaker: readNonEmptyString(input.speaker, "Dialogue line speaker")
  };
}

export function defineDialogueChoice(input: DialogueChoiceInput): DialogueChoice {
  const choice: DialogueChoice = {
    id: readNonEmptyString(input.id, "Dialogue choice id"),
    label: readNonEmptyString(input.label, "Dialogue choice label")
  };

  if (input.nextId === undefined) return choice;

  return {
    ...choice,
    nextId: readNonEmptyString(input.nextId, "Dialogue choice nextId")
  };
}

export function defineDialoguePrompt(input: DialoguePromptInput): DialoguePrompt {
  const choices = (input.choices ?? []).map((choice) => defineDialogueChoice(choice));
  assertUniqueChoiceIds(choices);

  return {
    line: defineDialogueLine(input.line),
    choices
  };
}

export function getDialoguePromptSnapshot(prompt: DialoguePrompt): DialoguePromptSnapshot {
  return {
    line: defineDialogueLine(prompt.line),
    choices: prompt.choices.map((choice) => defineDialogueChoice(choice))
  };
}

export function createDialogueChoiceState(prompt: DialoguePrompt): DialogueChoiceState {
  return {
    phase: "empty",
    prompt: getDialoguePromptSnapshot(prompt)
  };
}

export function selectDialogueChoice(
  state: DialogueChoiceState,
  choiceId: string
): DialogueChoiceState {
  const prompt = getDialoguePromptSnapshot(state.prompt);
  const choice = findDialogueChoice(
    prompt,
    readNonEmptyString(choiceId, "Dialogue choice selection id")
  );

  return {
    phase: "choice-selected",
    prompt,
    selectedChoiceId: choice.id
  };
}

export function clearDialogueChoiceSelection(state: DialogueChoiceState): DialogueChoiceState {
  return createDialogueChoiceState(state.prompt);
}

export function resolveDialogueChoiceSelection(state: DialogueChoiceState): DialogueChoiceState {
  const choice = getSelectedDialogueChoice(state);
  if (!choice) {
    throw new Error("Cannot resolve a dialogue choice before selecting a choice.");
  }

  return {
    phase: "choice-resolved",
    prompt: getDialoguePromptSnapshot(state.prompt),
    selectedChoiceId: choice.id,
    resolvedChoice: copyDialogueChoice(choice)
  };
}

export function getSelectedDialogueChoice(state: DialogueChoiceState): DialogueChoice | undefined {
  if (state.selectedChoiceId === undefined) return undefined;

  return copyDialogueChoice(
    findDialogueChoice(
      state.prompt,
      readNonEmptyString(state.selectedChoiceId, "Dialogue choice selection id")
    )
  );
}

export function getResolvedDialogueChoice(state: DialogueChoiceState): DialogueChoice | undefined {
  if (!state.resolvedChoice) return undefined;

  return copyDialogueChoice(state.resolvedChoice);
}

export function isDialogueChoiceSelected(state: DialogueChoiceState): boolean {
  return state.selectedChoiceId !== undefined;
}

export function isDialogueChoiceResolved(state: DialogueChoiceState): boolean {
  return state.resolvedChoice !== undefined;
}

export function getDialogueChoiceStateSnapshot(
  state: DialogueChoiceState
): DialogueChoiceStateSnapshot {
  const prompt = getDialoguePromptSnapshot(state.prompt);
  const selectedChoiceId =
    state.selectedChoiceId === undefined
      ? undefined
      : findDialogueChoice(
          prompt,
          readNonEmptyString(state.selectedChoiceId, "Dialogue choice selection id")
        ).id;

  return {
    phase: state.phase,
    prompt,
    selectedChoiceId,
    resolvedChoice: state.resolvedChoice ? copyDialogueChoice(state.resolvedChoice) : undefined,
    isSelected: selectedChoiceId !== undefined,
    isResolved: state.resolvedChoice !== undefined
  };
}

export function createDialoguePromptView(
  renderAdapter: RenderAdapter,
  renderScene: RenderScene,
  options: DialoguePromptViewOptions
): DialoguePromptView {
  const layout = createDialoguePromptViewLayout(options);
  let visible = options.visible ?? true;
  let promptSnapshot = getDialoguePromptSnapshot(options.prompt);
  let choiceNodes: RenderText[] = [];

  const line = createHudText(renderAdapter, renderScene, {
    text: formatDialogueLineText(promptSnapshot.line),
    x: layout.x,
    y: layout.y,
    fontSize: options.lineFontSize,
    visible,
    layer: options.layer
  });

  const syncChoiceNodes = (prompt: DialoguePrompt): void => {
    const nextChoiceNodes = prompt.choices.map((choice, index) => {
      const existing = choiceNodes[index];
      if (existing) {
        syncDialogueChoiceNode(existing, choice, index, layout, options.choiceFontSize, visible);
        return existing;
      }

      return createDialogueChoiceNode(
        renderAdapter,
        renderScene,
        choice,
        index,
        layout,
        options.choiceFontSize,
        visible,
        options.layer
      );
    });

    for (const staleNode of choiceNodes.slice(nextChoiceNodes.length)) {
      staleNode.destroy();
    }

    choiceNodes = nextChoiceNodes;
  };

  syncChoiceNodes(promptSnapshot);

  return {
    line,
    get choices() {
      return choiceNodes.slice();
    },
    setPrompt(prompt: DialoguePrompt): DialoguePromptSnapshot {
      promptSnapshot = getDialoguePromptSnapshot(prompt);
      line.setText(formatDialogueLineText(promptSnapshot.line));
      line.x = layout.x;
      line.y = layout.y;
      if (options.lineFontSize !== undefined) {
        line.fontSize = options.lineFontSize;
      }

      syncChoiceNodes(promptSnapshot);
      return getDialoguePromptSnapshot(promptSnapshot);
    },
    setVisible(nextVisible: boolean): void {
      visible = nextVisible;
      line.visible = visible;
      for (const choiceNode of choiceNodes) {
        choiceNode.visible = visible;
      }
    },
    getPromptSnapshot(): DialoguePromptSnapshot {
      return getDialoguePromptSnapshot(promptSnapshot);
    },
    destroy(): void {
      line.destroy();
      for (const choiceNode of choiceNodes) {
        choiceNode.destroy();
      }

      choiceNodes = [];
    }
  };
}

function assertUniqueChoiceIds(choices: readonly DialogueChoice[]): void {
  const seen = new Set<string>();

  for (const choice of choices) {
    if (seen.has(choice.id)) {
      throw new Error(`Dialogue prompt choice id "${choice.id}" must be unique.`);
    }

    seen.add(choice.id);
  }
}

function findDialogueChoice(prompt: DialoguePrompt, choiceId: string): DialogueChoice {
  const choice = prompt.choices.find((candidate) => candidate.id === choiceId);
  if (choice) return choice;

  throw new Error(`Dialogue choice id "${choiceId}" must belong to the current prompt.`);
}

function copyDialogueChoice(choice: DialogueChoice): DialogueChoice {
  return defineDialogueChoice(choice);
}

type DialoguePromptViewLayout = Readonly<{
  x: number;
  y: number;
  choiceStartY: number;
  choiceGap: number;
}>;

function createDialoguePromptViewLayout(options: DialoguePromptViewOptions): DialoguePromptViewLayout {
  const x = readFiniteNumber(options.x ?? 0, "Dialogue prompt view x");
  const y = readFiniteNumber(options.y ?? 0, "Dialogue prompt view y");

  return {
    x,
    y,
    choiceStartY: readFiniteNumber(options.choiceStartY ?? y + 36, "Dialogue prompt view choiceStartY"),
    choiceGap: readPositiveNumber(options.choiceGap ?? 28, "Dialogue prompt view choiceGap")
  };
}

function createDialogueChoiceNode(
  renderAdapter: RenderAdapter,
  renderScene: RenderScene,
  choice: DialogueChoice,
  index: number,
  layout: DialoguePromptViewLayout,
  fontSize: number | undefined,
  visible: boolean,
  layer: Extract<RenderSceneLayerName, "ui" | "overlay"> | undefined
): RenderText {
  return createHudText(renderAdapter, renderScene, {
    text: formatDialogueChoiceText(choice),
    x: layout.x,
    y: getDialogueChoiceNodeY(layout, index),
    fontSize,
    visible,
    layer
  });
}

function syncDialogueChoiceNode(
  node: RenderText,
  choice: DialogueChoice,
  index: number,
  layout: DialoguePromptViewLayout,
  fontSize: number | undefined,
  visible: boolean
): void {
  node.setText(formatDialogueChoiceText(choice));
  node.x = layout.x;
  node.y = getDialogueChoiceNodeY(layout, index);
  node.visible = visible;

  if (fontSize !== undefined) {
    node.fontSize = fontSize;
  }
}

function getDialogueChoiceNodeY(layout: DialoguePromptViewLayout, index: number): number {
  return layout.choiceStartY + index * layout.choiceGap;
}

function formatDialogueLineText(line: DialogueLine): string {
  return line.speaker ? `${line.speaker}: ${line.text}` : line.text;
}

function formatDialogueChoiceText(choice: DialogueChoice): string {
  return choice.label;
}

function readFiniteNumber(value: number, label: string): number {
  if (Number.isFinite(value)) return value;

  throw new Error(`${label} must be a finite number.`);
}

function readPositiveNumber(value: number, label: string): number {
  if (Number.isFinite(value) && value > 0) return value;

  throw new Error(`${label} must be a finite number greater than 0.`);
}

function readNonEmptyString(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized.length > 0) return normalized;

  throw new Error(`${label} must be a non-empty string.`);
}
