# Asset Processing Pipeline & Media Specification — Sprint S15

## 1. Supported Media Formats & Kinds

| Media Kind | Format Extensions | MIME Types | Extracted Metadata |
| :--- | :--- | :--- | :--- |
| **Image** | `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif` | `image/png`, `image/jpeg`, `image/webp`, `image/gif` | `widthPx`, `heightPx`, `aspectRatio`, `thumbnailUri` |
| **SVG Vector** | `.svg` | `image/svg+xml` | `viewBox`, `widthPx`, `heightPx`, `thumbnailUri` |
| **Font** | `.woff2`, `.woff`, `.ttf`, `.otf` | `font/woff2`, `font/woff`, `font/ttf`, `font/otf` | `fontFamily` |
| **Audio** | `.mp3`, `.wav`, `.aac`, `.ogg`, `.m4a` | `audio/mpeg`, `audio/wav`, `audio/aac`, `audio/ogg` | `durationMs`, `sampleRate`, `waveformBars` ($N$ amplitudes) |
| **Video** | `.mp4`, `.webm`, `.mov` | `video/mp4`, `video/webm` | `widthPx`, `heightPx`, `durationMs`, `fps`, `thumbnailFrameTimesMs` |

---

## 2. Pipeline Execution Stages

```
1. Import Stage
   ├── Receive Raw File Buffer / Drag & Drop Event
   ├── Classify MediaKind & Assign Stable AssetID
   
2. Validation Stage
   ├── File Size & Payload Check
   ├── MIME Type Verification
   
3. Metadata Extraction Stage
   ├── Dimensions & Aspect Ratio Calculation
   ├── SVG ViewBox & Path Structure Analysis
   ├── Audio Waveform Amplitude Extraction
   
4. Asset Registry Stage
   ├── Register AnimationAssetItem in AssetRegistryState
   
5. Canvas Placement Stage
   ├── Instantiate BuilderDocument Node referencing AssetID
   ├── Bind Link in AssetReferenceState
```

---

## 3. Fit Modes & Bounds Manipulations

- **`cover`**: Scales asset to cover container bounds while preserving aspect ratio.
- **`contain`**: Fits entire asset inside container bounds preserving aspect ratio.
- **`fill`**: Stretches asset to fill container dimensions exactly.
- **`none`**: Renders asset at native resolution regardless of container dimensions.
- **Crop Bounds**: Specified as `cropX`, `cropY`, `cropWidth`, `cropHeight` normalized sub-rectangle offsets.
