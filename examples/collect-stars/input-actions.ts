import {
  InputActionMap,
  defineKeyboardBinding
} from "@shuangxunian/leafer-game-engine/framework";

export const COLLECT_INPUT_ACTION = {
  MoveLeft: "move:left",
  MoveRight: "move:right",
  MoveUp: "move:up",
  MoveDown: "move:down",
  Confirm: "confirm"
} as const;

export function createCollectStarsInputActions(): InputActionMap {
  return new InputActionMap([
    {
      id: COLLECT_INPUT_ACTION.MoveLeft,
      bindings: [defineKeyboardBinding("a"), defineKeyboardBinding("arrowleft")]
    },
    {
      id: COLLECT_INPUT_ACTION.MoveRight,
      bindings: [defineKeyboardBinding("d"), defineKeyboardBinding("arrowright")]
    },
    {
      id: COLLECT_INPUT_ACTION.MoveUp,
      bindings: [defineKeyboardBinding("w"), defineKeyboardBinding("arrowup")]
    },
    {
      id: COLLECT_INPUT_ACTION.MoveDown,
      bindings: [defineKeyboardBinding("s"), defineKeyboardBinding("arrowdown")]
    },
    {
      id: COLLECT_INPUT_ACTION.Confirm,
      bindings: [defineKeyboardBinding(" "), defineKeyboardBinding("enter")]
    }
  ]);
}
