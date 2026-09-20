/**
 * useCameraControls.ts — Camera Control System for Three.js Scenes
 */

'use client';

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { subscribe, updateSubscription } from './SharedRenderLoop';

export interface CameraConfig {
  type?: 'perspective' | 'orthographic';
  fov?: number;
  position?: [number, number, number];
  target?: [number, number, number];
  zoom?: number;
  near?: number;
  far?: number;
}

export interface UseCameraControlsOptions {
  camera: React.RefObject<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>;
  config?: CameraConfig;
  pointerX?: number;
  pointerY?: number;
  scrollProgress?: number;
  isInteractive?: boolean;
}

export function useCameraControls({
  camera,
  config,
  pointerX = 0,
  pointerY = 0,
  scrollProgress = 0,
  isInteractive = true,
}: UseCameraControlsOptions) {
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const subIdRef = useRef<string | null>(null);

  useEffect(() => {
    const cam = camera.current;
    if (!cam || !isInteractive) return;

    const subId = `camera-controls-${Math.random().toString(36).slice(2, 8)}`;
    subIdRef.current = subId;

    subscribe(subId, () => {
      const c = camera.current;
      if (!c) return;

      if (config?.target) {
        targetRef.current.set(...config.target);
      }

      const lookTarget = targetRef.current.clone();
      lookTarget.x += pointerX * 0.3;
      lookTarget.y += pointerY * 0.3;

      if (scrollProgress > 0) {
        lookTarget.z -= scrollProgress * 2;
      }

      c.lookAt(lookTarget);
    }, 70);

    return () => {
      if (subIdRef.current) {
        updateSubscription(subIdRef.current, { active: false });
      }
    };
  }, [camera, config, pointerX, pointerY, scrollProgress, isInteractive]);
}
