# Input Actions Boundary

## Purpose

`leaferGame` input action support is part of the frontend 2D game engine package.

It lets downstream games describe gameplay intent such as `move:left`, `confirm`, `select`, or `pause` separately from physical keyboard keys or pointer buttons.

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

The browser keyboard bridge writes into this system by normalizing `KeyboardEvent.key` values through the same lowercase helper used by action bindings. The browser pointer button bridge writes deterministic raw input ids such as `pointer:primary`.

### Keyboard Bindings

Keyboard bindings are small data objects:

```ts
import { defineKeyboardBinding } from "@shuangxunian/leafer-game-engine/framework";

const left = defineKeyboardBinding("ArrowLeft");
```

`defineKeyboardBinding(...)` normalizes keys consistently with `BrowserKeyboardBridge`.

### Pointer Button Bindings

Pointer button bindings are small data objects:

```ts
import { definePointerButtonBinding } from "@shuangxunian/leafer-game-engine/framework";

const select = definePointerButtonBinding("primary");
```

Supported pointer buttons are:

- `primary`
- `secondary`
- `auxiliary`

`definePointerButtonBinding(...)` normalizes button names, and `getPointerButtonInputId(...)` exposes the matching raw input id shape used by `InputSystem`.

The current pointer model intentionally covers button state only. Future stages can add pointer position, touch gestures, or gamepad bindings if they remain reusable package APIs.

### Browser Pointer Button Bridge

Browser projects can attach pointer button events to `InputSystem`:

```ts
import {
  BrowserPointerButtonBridge,
  InputSystem
} from "@shuangxunian/leafer-game-engine/framework";

const input = new InputSystem();
const pointer = new BrowserPointerButtonBridge(input);
pointer.attach();
```

The bridge maps browser pointer button numbers to normalized input ids:

- `0` maps to `pointer:primary`
- `1` maps to `pointer:auxiliary`
- `2` maps to `pointer:secondary`

`pointerup`, `pointercancel`, `blur`, and `detach()` release tracked pointer button state so games do not keep stuck input after browser interruption.

The bridge intentionally tracks button state only. It does not track pointer position, drag state, gesture recognition, hit testing, or editor controls.

### Action Map

`InputActionMap` maps semantic action ids to one or more input bindings:

```ts
import {
  InputActionMap,
  defineKeyboardBinding,
  definePointerButtonBinding
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
      defineKeyboardBinding("Enter"),
      definePointerButtonBinding("primary")
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
- primary pointer button input can also trigger `confirm`
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

The snapshot can show action id, keyboard bindings, pointer button bindings, pressed state, and just-pressed state.

If no live `InputSystem` is provided, tooling still shows the action map and omits live pressed state.

Tooling does not mutate actions, bindings, input state, scenes, or systems.

## Current Limitations

The closed `0.19.x` pointer/input stage intentionally does not include:

- keybinding settings UI
- runtime rebinding controls in tooling
- local storage or user profile persistence
- gamepad bindings
- pointer position tracking
- touch gestures
- input recording or replay
- accessibility preset management
- editor controls

Those capabilities can be added in future engine stages only if they remain reusable package APIs and do not turn this repository into an editor product.

## Stage Status

The `0.19.x` pointer/input runtime primitives stage is complete.

It covers pointer button bindings, browser pointer button bridging, read-only tooling formatting, and dodge-blocks example consumption. It does not cover pointer position, gestures, drag/drop, settings UI, or editor workflows.

## Consumer Guidance

Use `@shuangxunian/leafer-game-engine/framework` for action mapping:

```ts
import {
  InputActionMap,
  InputSystem,
  defineKeyboardBinding,
  definePointerButtonBinding
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
