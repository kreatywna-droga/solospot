/**
 * useGLBLoader.ts — GLB/GLTF Model Loading via Three.js
 */

'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createResourceTracker } from './ResourceTracker';

export type GLBLoadState = 'idle' | 'loading' | 'loaded' | 'error';

export interface GLBModelConfig {
  url: string;
  scale?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  animationName?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export interface UseGLBLoaderOptions {
  scene: React.RefObject<THREE.Scene | null>;
  config?: GLBModelConfig;
  isPlaying?: boolean;
}

export function useGLBLoader({ scene, config, isPlaying = true }: UseGLBLoaderOptions) {
  const [loadState, setLoadState] = useState<GLBLoadState>('idle');
  const [progress, setProgress] = useState(0);
  const modelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const trackerRef = useRef<ReturnType<typeof createResourceTracker> | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const loadModel = useCallback(async () => {
    if (!scene.current || !config?.url) return;

    setLoadState('loading');
    setProgress(0);

    const tracker = createResourceTracker(`glb-${config.url.slice(-20)}`);
    trackerRef.current = tracker;

    try {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const loader = new GLTFLoader();

      const gltf: GLTF = await new Promise((resolve, reject) => {
        loader.load(
          config.url,
          (gltf) => resolve(gltf),
          (event) => setProgress(event.loaded / event.total),
          (error) => reject(error)
        );
      });

      const model = gltf.scene;

      if (config.scale) model.scale.set(...config.scale);
      if (config.position) model.position.set(...config.position);
      if (config.rotation) model.rotation.set(...config.rotation);
      if (config.castShadow !== undefined || config.receiveShadow !== undefined) {
        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            if (config.castShadow !== undefined) child.castShadow = config.castShadow;
            if (config.receiveShadow !== undefined) child.receiveShadow = config.receiveShadow;
          }
        });
      }

      scene.current.add(model);
      modelRef.current = model;

      tracker.track('three-mesh', () => {
        scene.current?.remove(model);
        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => {
                if (m instanceof THREE.Material) m.dispose();
              });
            } else if (child.material instanceof THREE.Material) {
              child.material.dispose();
            }
          }
        });
      });

      if (gltf.animations.length > 0 && config.animationName) {
        const mixer = new THREE.AnimationMixer(model);
        mixerRef.current = mixer;
        const clip = gltf.animations.find((a: THREE.AnimationClip) => a.name === config.animationName) || gltf.animations[0];
        if (clip) mixer.clipAction(clip).play();

        const clock = new THREE.Clock();
        const animateMixer = () => {
          mixer.update(clock.getDelta());
          rafIdRef.current = requestAnimationFrame(animateMixer);
        };
        rafIdRef.current = requestAnimationFrame(animateMixer);
      }

      setLoadState('loaded');
    } catch (err) {
      console.warn('[GLBLoader] Failed to load model:', err);
      setLoadState('error');
    }
  }, [scene, config]);

  useEffect(() => {
    if (isPlaying && config?.url && loadState === 'idle') {
      loadModel();
    }

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      trackerRef.current?.disposeAll();
      modelRef.current = null;
      mixerRef.current = null;
    };
  }, [isPlaying, config?.url, loadState, loadModel]);

  return { loadState, progress, model: modelRef };
}
