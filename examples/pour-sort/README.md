# Pour Sort

`pour-sort` is the first pointer-first puzzle example for `leaferGame`.

It validates the route, browser boot path, local pointer coordinates, rectangle/entity picking, source-target selection state, generic source-target action snapshots, and a tiny example-owned bottle-pouring loop needed by pouring, sorting, grouping, matching, and click-first puzzle games.

Current scope:

- boot through `?example=pour-sort`
- create a small row of selectable bottle entities
- install scene input through `createSceneRuntimePreset(...)`
- reuse scene input and attach pointer bridges through `createSceneQuickStartBundle(...)`
- map pointer events to local game coordinates
- pick bottle entities through framework hit testing
- store source-target selection through framework selection helpers
- turn ready selection into generic source-target action data
- record allowed/blocked source-target action results in the gameplay snapshot
- validate simple top-color pours in example-owned code
- render liquid color segments
- update HUD text with selection, move count, invalid move feedback, and solved state
- expose a read-only gameplay snapshot

Out of scope for this example:

- generic puzzle rules inside the engine package
- undo, hints, score, progression, or level authoring
- visual editor selection handles
- launcher, gallery, marketplace, SDK, account, ads, or publishing workflows

The exact puzzle rules stay example-owned. The engine package supplies the runtime primitives; it does not become a water-sort framework.
