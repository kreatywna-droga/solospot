# Audio & Video Timeline Workflow Specification — Sprint S16

## 1. Audio Clip Lifecycle & Operations

```
Import Audio Asset
       ↓
Assign AssetID
       ↓
Create AudioMediaClip DTO (startTimeMs, durationMs, trim)
       ↓
Timeline Track Placement
       ↓
Non-Destructive Trimming (inPointMs / outPointMs) & Splitting
       ↓
Audio Settings (Volume [0..1], Gain dB, Mute, Fade In/Out)
       ↓
Playhead Evaluation (AudioTimelineEngine.evaluateAudioPlayback)
```

---

## 2. Video Clip Lifecycle & Operations

```
Import Video Asset
       ↓
Assign AssetID
       ↓
Create VideoMediaClip DTO (startTimeMs, durationMs, trim, posterFrame)
       ↓
Timeline Track Placement
       ↓
Transform & Fit Mode (contain, cover, fill, none) & Crop Bounds
       ↓
Frame Evaluation (VideoTimelineEngine.evaluateVideoPlayback)
       ↓
RenderingEngine → CanvasRenderer Output
```

---

## 3. Clip Trimming & Splitting Semantics

- **Trim Left**: Shifts `startTimeMs` downstream while advancing `inPointMs` inside source asset. Decreases active `durationMs`.
- **Trim Right**: Adjusts active `durationMs` and `outPointMs` without shifting `startTimeMs`.
- **Split Clip**: Splits a single clip at playhead time $t$ into two contiguous clip instances (`leftClip` and `rightClip`), preserving original source offsets.
- **Ripple Edit**: Shifts all clips downstream of pivot time $t$ by time delta $\Delta t$, preserving relative clip spacing.
