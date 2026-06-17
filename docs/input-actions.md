# Input Actions Boundary

## Purpose

`leaferGame` input action support is part of the frontend 2D game engine package.

It lets downstream games describe gameplay intent such as `move:left`, `confirm`, or `pause` separately from physical keyboard keys.

It is not a keybinding settings screen, visual editor UI, profile persistence system, gamepad adapter, touch gesture system, or browser control panel.

## Layers

### Raw Input State

`InputSystem` stores normalized low-level input state:

- currently pressed input ids
- just-pressed input ids for the current frame
- `press(...)`
- `release(...)`
- `isPressed(...)`
- `wasPressed(...)`
- `lateUpdate(...)` cleanup for just-pressed state

The browser keyboard bridge writes into this system by normalizing `KeyboardEvent.key` values through the same lowercase helper used by action bindings.

### Keyboard Bindings

Keyboard bindings are small data objects:

```ts
import { defineKeyboardBinding } from "@shuangxunian/leafer-game-engine/framework";

const left = defineKeyboardBinding("ArrowLeft");
```

`defineKeyboardBinding(...)` normalizes keys consistently with `BrowserKeyboardBridge`.

The current binding model intentionally supports keyboard bindings only. Future stages can add gamepad or touch bindings if they remain reusable package APIs.

### Action Map

`InputActionMap` maps semantic action ids to one or more input bindings:

```ts
import {
  InputActionMap,
  defineKeyboardBinding
} from "@shuangxunian/leafer-game-engine/framework";

const actions = new InputActionMap([
  {
    id: "move:left",
    bindings: [
      defineKeyboardBinding("a"),
      defineKeyboardBinding("ArrowLeft")
    ]
  },
  {
    id: "confirm",
    bindings: [
      defineKeyboardBinding(" "),
      defineKeyboardBinding("Enter")
    ]
  }
]);
```

Consumers can register, replace, bind, unbind, remove, list, and query actions in pure TypeScript without DOM APIs.

### Gameplay Consumption

Gameplay code should query actions instead of physical keys:

```ts
if (actions.isPressed(input, "move:left")) {
  // Move the player left.
}

if (actions.wasPressed(input, "pause")) {
  // Toggle pause.
}
```

This keeps gameplay systems stable even if a downstream game changes keyboard bindings later.

### Example Consumption

`examples/dodge-blocks` consumes input actions as a downstream-style game:

- physical keyboard keys are declared in `input-actions.ts`
- player movement reads `move:left`, `move:right`, `move:up`, and `move:down`
- game flow controls read `confirm` and `pause`
- gameplay files do not query raw physical keys directly

The example remains a consumer integration sample, not engine implementation.

### Tooling Visibility

Tooling exposes read-only input action observability:

- `createToolingSnapshot(scene, { inputActions, input })`
- `createInputActionSnapshot(...)`
- `formatInputActionSnapshot(...)`
- `createInputActionsPanelSection(...)`

The snapshot can show action id, keyboard bindings, pressed state, and just-pressed state.

If no live `InputSystem` is provided, tooling still shows the action map and omits live pressed state.

Tooling does not mutate actions, bindings, input state, scenes, or systems.

## Current Limitations

The current sprint intentionally does not include:

- keybinding settings UI
- runtime rebinding controls in tooling
- local storage or user profile persistence
- gamepad bindings
- touch gestures
- input recording or replay
- accessibility preset management
- editor controls

Those capabilities can be added in future engine stages only if they remain reusable package APIs and do not turn this repository into an editor product.

## Consumer Guidance

Use `@shuangxunian/leafer-game-engine/framework` for action mapping:

```ts
import {
  InputActionMap,
  InputSystem,
  defineKeyboardBinding
} from "@shuangxunian/leafer-game-engine/framework";
```

Use `@shuangxunian/leafer-game-engine/tooling` for read-only action observability:

```ts
import {
  createInputActionSnapshot,
  formatInputActionSnapshot
} from "@shuangxunian/leafer-game-engine/tooling";
```

Keep project-specific action ids, keyboard layouts, and control schemes in downstream games. Move only reusable input primitives back into the engine package.
