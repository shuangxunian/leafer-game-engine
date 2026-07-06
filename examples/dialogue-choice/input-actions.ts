import {
  InputActionMap,
  defineKeyboardBinding
} from "@shuangxunian/leafer-game-engine/framework";

export const DIALOGUE_INPUT_ACTION = {
  PreviousChoice: "choice:previous",
  NextChoice: "choice:next",
  ConfirmChoice: "choice:confirm",
  ResetPrompt: "choice:reset"
} as const;

export function createDialogueChoiceInputActions(): InputActionMap {
  return new InputActionMap([
    {
      id: DIALOGUE_INPUT_ACTION.PreviousChoice,
      bindings: [defineKeyboardBinding("w"), defineKeyboardBinding("arrowup")]
    },
    {
      id: DIALOGUE_INPUT_ACTION.NextChoice,
      bindings: [defineKeyboardBinding("s"), defineKeyboardBinding("arrowdown")]
    },
    {
      id: DIALOGUE_INPUT_ACTION.ConfirmChoice,
      bindings: [defineKeyboardBinding(" "), defineKeyboardBinding("enter")]
    },
    {
      id: DIALOGUE_INPUT_ACTION.ResetPrompt,
      bindings: [defineKeyboardBinding("r")]
    }
  ]);
}
