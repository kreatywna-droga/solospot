/**
 * CameraModel.ts — Sprint S21 Camera Domain Model (ETAP 1)
 *
 * Defines pure DTO data structures for Camera, CameraTransform, CameraPosition,
 * CameraZoom, CameraRotation, CameraBounds, CameraViewport, CameraProjection, and CameraState.
 *
 * Headless model: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export interface CameraPosition {
  readonly x: number;
  readonly y: number;
  readonly z?: number;
}

export type CameraZoom = number; // 0.01 - 100.0 (1.0 = 100%)

export type CameraRotation = number; // Rotation in degrees (0 - 360)

export interface CameraTransform {
  readonly position: CameraPosition;
  readonly zoom: CameraZoom;
  readonly rotationDeg: CameraRotation;
}

export const DEFAULT_CAMERA_TRANSFORM: CameraTransform = {
  position: { x: 0, y: 0, z: 0 },
  zoom: 1.0,
  rotationDeg: 0,
};

export interface CameraBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface CameraViewport {
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
}

export const DEFAULT_CAMERA_VIEWPORT: CameraViewport = {
  width: 1920,
  height: 1080,
  devicePixelRatio: 1.0,
};

export type CameraProjection = 'orthographic' | 'perspective';

export interface CameraState {
  readonly id: string;
  readonly name: string;
  readonly transform: CameraTransform;
  readonly viewport: CameraViewport;
  readonly projection: CameraProjection;
  readonly isActive: boolean;
}

export interface Camera {
  readonly id: string;
  readonly name: string;
  readonly transform: CameraTransform;
  readonly viewport: CameraViewport;
  readonly projection: CameraProjection;
  readonly bounds?: CameraBounds;
  readonly props?: Record<string, unknown>;
}

export function createCameraTransform(params?: {
  x?: number;
  y?: number;
  z?: number;
  zoom?: number;
  rotationDeg?: number;
}): CameraTransform {
  return {
    position: {
      x: params?.x ?? 0,
      y: params?.y ?? 0,
      z: params?.z ?? 0,
    },
    zoom: params?.zoom ?? 1.0,
    rotationDeg: params?.rotationDeg ?? 0,
  };
}

export function createCameraViewport(params?: {
  width?: number;
  height?: number;
  devicePixelRatio?: number;
}): CameraViewport {
  return {
    width: params?.width ?? 1920,
    height: params?.height ?? 1080,
    devicePixelRatio: params?.devicePixelRatio ?? 1.0,
  };
}

export function createCamera(params: {
  id: string;
  name?: string;
  transform?: Partial<CameraTransform>;
  viewport?: Partial<CameraViewport>;
  projection?: CameraProjection;
  bounds?: CameraBounds;
  props?: Record<string, unknown>;
}): Camera {
  return {
    id: params.id,
    name: params.name ?? `Camera_${params.id}`,
    transform: {
      position: {
        x: params.transform?.position?.x ?? 0,
        y: params.transform?.position?.y ?? 0,
        z: params.transform?.position?.z ?? 0,
      },
      zoom: params.transform?.zoom ?? 1.0,
      rotationDeg: params.transform?.rotationDeg ?? 0,
    },
    viewport: {
      width: params.viewport?.width ?? 1920,
      height: params.viewport?.height ?? 1080,
      devicePixelRatio: params.viewport?.devicePixelRatio ?? 1.0,
    },
    projection: params.projection ?? 'orthographic',
    bounds: params.bounds,
    props: params.props ?? {},
  };
}
