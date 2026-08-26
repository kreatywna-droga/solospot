# S24 Timeline Keyframe API Reference

## Keyframe Selection Controller (`TimelineSelectionController`)
- `selectSingleKeyframe(clipId, trackId, keyframeId)`
- `toggleKeyframe(state, ref)`
- `rangeSelect(state, timeline, clipId, trackId, startRef, endRef)`
- `marqueeSelect(state, positions, box)`
- `selectAllKeyframes(timeline)`
- `deselectAllKeyframes()`
- `isKeyframeSelected(state, keyframeId)`

## Keyframe Manipulation Controller (`TimelineKeyframeController`)
- `moveKeyframe(doc, nodeId, ref, newTimeOffset)`
- `batchMoveKeyframes(doc, nodeId, refs, deltaMs)`
- `copyKeyframes(doc, nodeId, refs)`
- `pasteKeyframes(doc, nodeId, clipId, trackId, payload, targetTimeOffset)`
- `duplicateKeyframes(doc, nodeId, clipId, trackId, refs, offsetShiftMs)`
- `deleteKeyframes(doc, nodeId, refs)`

## Timeline Snapping Controller (`TimelineSnappingController`)
- `snapTime(rawTimeMs, timeline, markers, playheadTimeMs, customConfig)`

## Markers & Regions Controller (`TimelineMarkersRegionsController`)
- `createMarker(params)`
- `addMarker(state, marker)`
- `moveMarker(state, markerId, newTimeMs)`
- `removeMarker(state, markerId)`
- `toggleLockMarker(state, markerId)`
- `setLoopRegion(state, startTimeMs, endTimeMs, enabled)`
- `toggleLoopRegion(state, enabled)`

## Curve Authoring Controller (`TimelineCurveAuthoringController`)
- `setKeyframeEasingPreset(doc, nodeId, ref, preset)`
- `setCustomCubicBezier(doc, nodeId, ref, points)`
- `updateBezierTangentHandles(doc, nodeId, ref, handle, x, y)`
- `setDirectKeyframeValue(doc, nodeId, ref, newValue)`
- `extractKeyframeEasingPoints(doc, nodeId, ref)`

## Timeline Navigation View Controller (`TimelineViewController`)
- `zoomTimeline(viewport, zoomFactor, anchorTimeMs)`
- `panTimeline(viewport, deltaTimeMs)`
- `fitAnimation(viewport, durationMs)`
- `fitSelection(viewport, minTimeMs, maxTimeMs)`
- `centerPlayhead(viewport, playheadTimeMs)`

## Keyboard Interaction Handler (`TimelineKeyboardInteractionHandler`)
- `handleKeyDown(event, doc, nodeId, timeline, selection, clipboardPayload, playheadTimeMs)`
