# S21 — Viewport & Camera System API Specification

## 1. Camera Domain Core DTOs (`CameraModel.ts`)

### `CameraPosition`
```typescript
export interface CameraPosition {
  readonly x: number;
  readonly y: number;
  readonly z?: number;
}
```

### `CameraTransform`
```typescript
export interface CameraTransform {
  readonly position: CameraPosition;
  readonly zoom: number; // 0.05 - 50.0 (1.0 = 100%)
  readonly rotationDeg: number; // 0 - 360
}
```

### `CameraViewport`
```typescript
export interface CameraViewport {
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
}
```

### `Camera`
```typescript
export interface Camera {
  readonly id: string;
  readonly name: string;
  readonly transform: CameraTransform;
  readonly viewport: CameraViewport;
  readonly projection: 'orthographic' | 'perspective';
  readonly bounds?: CameraBounds;
}
```

---

## 2. Camera Operations API (`CameraOperationsEngine.ts`)

### `panCamera`
```typescript
static panCamera(camera: Camera, dx: number, dy: number): Camera
```
Pans camera position by delta values `(dx, dy)`.

### `zoomCamera`
```typescript
static zoomCamera(camera: Camera, factor: number, pivotPoint?: { x: number; y: number }): Camera
```
Multiplies current camera zoom by `factor`, clamping result between `0.05` and `50.0`. Supports zoom around an optional world space `pivotPoint`.

### `rotateCamera`
```typescript
static rotateCamera(camera: Camera, deltaDeg: number): Camera
```
Applies rotation delta in degrees and normalizes within range `[0, 360)`.

### `fitToContent`
```typescript
static fitToContent(camera: Camera, contentBounds: CameraBounds, padding?: number): Camera
```
Calculates zoom scale and centers camera position to fit specified content bounds into the viewport.

### `resetView`
```typescript
static resetView(camera: Camera): Camera
```
Resets position to `(0, 0)`, zoom to `1.0` (100%), and rotation to `0°`.

---

## 3. Coordinate Systems API (`CoordinateSystems.ts`)

### `computeCameraMatrix`
```typescript
static computeCameraMatrix(camera: Camera): Matrix2D
```
Computes 2D affine transformation matrix `[a, b, c, d, e, f]` for camera position, scale, and rotation.

### `worldToScreen` & `screenToWorld`
```typescript
static worldToScreen(point: { x: number; y: number }, camera: Camera): { x: number; y: number }
static screenToWorld(point: { x: number; y: number }, camera: Camera): { x: number; y: number }
```
Transforms 2D coordinates between World space and Screen space taking `devicePixelRatio` into account.

---

## 4. Viewport Layout API (`ViewportModel.ts`)

### `MultiViewportLayout`
```typescript
export interface MultiViewportLayout {
  readonly layoutMode: 'single' | 'split-vertical' | 'split-horizontal' | 'quad' | 'pip';
  readonly viewports: ReadonlyArray<ViewportConfiguration>;
  readonly primaryViewportId: string;
}
```

---

## 5. UI Components API

- `<ZoomControls camera={camera} onCameraChange={setCamera} contentBounds={bounds} />`
- `<MultiViewportContainer layout={layout} onLayoutChange={setLayout} renderViewportContent={fn} />`
- `<RulersGuides camera={camera} config={config} onConfigChange={setConfig} />`
