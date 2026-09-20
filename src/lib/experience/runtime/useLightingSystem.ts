/**
 * useLightingSystem.ts — Controlled Lighting Runtime for Three.js
 *
 * Provides a controlled lighting vocabulary:
 *   - Ambient: global fill light
 *   - Directional: sun/moon parallel light with shadows
 *   - Point: omnidirectional light source
 *   - Spot: cone-shaped focused light
 *
 * All lights are configurable via serializable config.
 * Proper disposal on unmount.
 */

'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { createResourceTracker } from './ResourceTracker';

export interface LightConfig {
  type: 'ambient' | 'directional' | 'point' | 'spot';
  color?: string;
  intensity?: number;
  position?: [number, number, number];
  target?: [number, number, number];
  castShadow?: boolean;
  shadowMapSize?: number;
  distance?: number;
  angle?: number;
  penumbra?: number;
}

export interface UseLightingSystemOptions {
  scene: React.RefObject<THREE.Scene | null>;
  lights?: LightConfig[];
  isPlaying?: boolean;
}

export function useLightingSystem({ scene, lights, isPlaying = true }: UseLightingSystemOptions) {
  const lightsRef = useRef<THREE.Light[]>([]);
  const trackerRef = useRef<ReturnType<typeof createResourceTracker> | null>(null);

  useEffect(() => {
    if (!scene.current || !lights || !isPlaying) return;

    const tracker = createResourceTracker('lighting-system');
    trackerRef.current = tracker;

    for (const lightDef of lights) {
      let light: THREE.Light;

      switch (lightDef.type) {
        case 'ambient':
          light = new THREE.AmbientLight(
            new THREE.Color(lightDef.color || '#ffffff'),
            lightDef.intensity ?? 0.5
          );
          break;

        case 'directional': {
          const dirLight = new THREE.DirectionalLight(
            new THREE.Color(lightDef.color || '#ffffff'),
            lightDef.intensity ?? 1
          );
          if (lightDef.position) dirLight.position.set(...lightDef.position);
          if (lightDef.target) {
            const target = new THREE.Vector3(...lightDef.target);
            dirLight.target.position.copy(target);
            scene.current.add(dirLight.target);
          }
          if (lightDef.castShadow) {
            dirLight.castShadow = true;
            const mapSize = lightDef.shadowMapSize ?? 1024;
            dirLight.shadow.mapSize.width = mapSize;
            dirLight.shadow.mapSize.height = mapSize;
          }
          light = dirLight;
          break;
        }

        case 'point': {
          const pointLight = new THREE.PointLight(
            new THREE.Color(lightDef.color || '#ffffff'),
            lightDef.intensity ?? 1,
            lightDef.distance ?? 50
          );
          if (lightDef.position) pointLight.position.set(...lightDef.position);
          light = pointLight;
          break;
        }

        case 'spot': {
          const spotLight = new THREE.SpotLight(
            new THREE.Color(lightDef.color || '#ffffff'),
            lightDef.intensity ?? 1
          );
          if (lightDef.position) spotLight.position.set(...lightDef.position);
          if (lightDef.distance) spotLight.distance = lightDef.distance;
          if (lightDef.angle) spotLight.angle = lightDef.angle;
          if (lightDef.penumbra !== undefined) spotLight.penumbra = lightDef.penumbra;
          if (lightDef.castShadow) spotLight.castShadow = true;
          light = spotLight;
          break;
        }

        default:
          continue;
      }

      scene.current.add(light);
      lightsRef.current.push(light);

      tracker.track('three-mesh', () => {
        scene.current?.remove(light);
        const idx = lightsRef.current.indexOf(light);
        if (idx >= 0) lightsRef.current.splice(idx, 1);
      });
    }

    return () => {
      tracker.disposeAll();
      lightsRef.current = [];
    };
  }, [scene, lights, isPlaying]);

  return { lights: lightsRef };
}
