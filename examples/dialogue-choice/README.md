# Dialogue Choice

`dialogue-choice` is the first narrative/UI example shell for `leaferGame`.

It validates that a downstream browser game can consume dialogue data, choice state, prompt rendering, keyboard input actions, example-owned prompt routing, and a read-only gameplay snapshot without adding new public package API.

Current scope:

- boot through `?example=dialogue-choice`
- render a simple stage, character placeholder, prompt panel, dialogue line, and choices
- use `defineDialoguePrompt(...)` for example-owned prompt data
- use `createDialogueChoiceState(...)`, `selectDialogueChoice(...)`, `resolveDialogueChoiceSelection(...)`, and `getDialogueChoiceStateSnapshot(...)` for deterministic choice state
- use `createDialoguePromptView(...)` for screen-space dialogue text and choice text
- route resolved choices to the next example-owned prompt through local `nextId` values
- record visited prompt ids, last resolved choice, and completion state in the gameplay snapshot
- install scene input through `createSceneRuntimePreset(...)`
- map keyboard input through `InputActionMap` and boot-time `createSceneQuickStartBundle(...)`
- expose a read-only gameplay snapshot

Out of scope for this example:

- reusable story format or branching content engine
- scripting language, timeline editor, graph editor, or visual UI builder
- save/load framework, localization workflow, launcher, gallery, marketplace, SDK, account, ads, analytics, monetization, or publishing workflows

The exact prompt content, choice effects, and scene transitions stay example-owned. The engine package supplies small runtime primitives; it does not become a galgame authoring product.
