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

function assertUniqueChoiceIds(choices: readonly DialogueChoice[]): void {
  const seen = new Set<string>();

  for (const choice of choices) {
    if (seen.has(choice.id)) {
      throw new Error(`Dialogue prompt choice id "${choice.id}" must be unique.`);
    }

    seen.add(choice.id);
  }
}

function readNonEmptyString(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized.length > 0) return normalized;

  throw new Error(`${label} must be a non-empty string.`);
}
