# Pour Sort

`pour-sort` is the first pointer-first puzzle example shell for `leaferGame`.

It validates the route, browser boot path, local pointer coordinates, rectangle/entity picking, and source-target selection state needed by pouring, sorting, grouping, matching, and click-first puzzle games.

Current scope:

- boot through `?example=pour-sort`
- create a small row of selectable bottle entities
- map pointer events to local game coordinates
- pick bottle entities through framework hit testing
- store source-target selection through framework selection helpers
- update HUD text with the selected source or source-target pair

Out of scope for this shell:

- water-sort rules
- moving liquid segments
- undo, hints, score, progression, or level authoring
- visual editor selection handles
- launcher, gallery, marketplace, SDK, account, ads, or publishing workflows

The next slice can turn this shell into a small playable loop while keeping exact puzzle rules example-owned.
