import {
  InputActionMap,
  defineKeyboardBinding
} from "@shuangxunian/leafer-game-engine/framework";

export const DODGE_INPUT_ACTION = {
  MoveLeft: "move:left",
  MoveRight: "move:right",
  MoveUp: "move:up",
  MoveDown: "move:down",
  Confirm: "confirm",
  Pause: "pause"
} as const;

export type DodgeInputAction = typeof DODGE_INPUT_ACTION[keyof typeof DODGE_INPUT_ACTION];

export function createDodgeInputActions(): InputActionMap {
  return new InputActionMap([
    {
      id: DODGE_INPUT_ACTION.MoveLeft,
      bindings: [defineKeyboardBinding("a"), defineKeyboardBinding("arrowleft")]
    },
    {
      id: DODGE_INPUT_ACTION.MoveRight,
      bindings: [defineKeyboardBinding("d"), defineKeyboardBinding("arrowright")]
    },
    {
      id: DODGE_INPUT_ACTION.MoveUp,
      bindings: [defineKeyboardBinding("w"), defineKeyboardBinding("arrowup")]
    },
    {
      id: DODGE_INPUT_ACTION.MoveDown,
      bindings: [defineKeyboardBinding("s"), defineKeyboardBinding("arrowdown")]
    },
    {
      id: DODGE_INPUT_ACTION.Confirm,
      bindings: [defineKeyboardBinding(" "), defineKeyboardBinding("enter")]
    },
    {
      id: DODGE_INPUT_ACTION.Pause,
      bindings: [defineKeyboardBinding("p"), defineKeyboardBinding("escape")]
    }
  ]);
}
