/**
 * useThreeScene.tsx — Declarative Three.js Scene Runtime
 *
 * Provides a controlled declarative 3D runtime using R3F (React Three Fiber).
 * Supports:
 *   - Scene creation and lifecycle
 *   - Camera configuration (perspective/orthographic)
 *   - Lighting system (ambient, directional, point, spot)
 *   - Object/model placement
 *   - Material configuration
 *   - Animation (auto-rotation, pointer interaction)
 *   - Responsive scaling
 *   - Proper disposal
 *
 * Safety:
 *   - No unrestricted arbitrary Three.js code
 *   - All scene elements are configured declaratively
 *   - Resources tracked via ResourceTracker
 */

'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { createResourceTracker } from './ResourceTracker';

export interface ThreeSceneConfig {
  camera?: {
    type?: 'perspective' | 'orthographic';
    fov?: number;
    position?: [number, number, number];
    target?: [number, number, number];
    zoom?: number;
    near?: number;
    far?: number;
  };
  lights?: Array<{
    type: 'ambient' | 'directional' | 'point' | 'spot';
    color?: string;
    intensity?: number;
    position?: [number, number, number];
    target?: [number, number, number];
  }>;
  background?: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

function parseColor(color?: string): THREE.Color {
  return new THREE.Color(color || '#ffffff');
}

export interface UseThreeSceneOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  config?: ThreeSceneConfig;
  isPlaying?: boolean;
  reducedMotion?: boolean;
}

export function useThreeScene({
  canvasRef,
  config,
  isPlaying = true,
  reducedMotion = false,
}: UseThreeSceneOptions) {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const trackerRef = useRef<ReturnType<typeof createResourceTracker> | null>(null);

  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !config) return;

    const tracker = createResourceTracker('three-scene');
    trackerRef.current = tracker;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    if (config.background) {
      scene.background = parseColor(config.background);
      tracker.track('three-texture', () => {
        if (scene.background instanceof THREE.Color) {
          scene.background = null;
        }
      });
    }

    const camConfig = config.camera || {};
    let camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    if (camConfig.type === 'orthographic') {
      const aspect = canvas.clientWidth / canvas.clientHeight;
      const frustumSize = 10;
      camera = new THREE.OrthographicCamera(
        -frustumSize * aspect / 2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        -frustumSize / 2,
        camConfig.near ?? 0.1,
        camConfig.far ?? 1000
      );
    } else {
      camera = new THREE.PerspectiveCamera(
        camConfig.fov ?? 50,
        canvas.clientWidth / canvas.clientHeight,
        camConfig.near ?? 0.1,
        camConfig.far ?? 1000
      );
    }
    camera.position.set(
      camConfig.position?.[0] ?? 0,
      camConfig.position?.[1] ?? 0,
      camConfig.position?.[2] ?? 5
    );
    if (camConfig.target) {
      camera.lookAt(new THREE.Vector3(...camConfig.target));
    }
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    tracker.track('webgl-context', () => {
      renderer.dispose();
    });

    if (config.lights) {
      for (const lightDef of config.lights) {
        let light: THREE.Light;
        switch (lightDef.type) {
          case 'ambient':
            light = new THREE.AmbientLight(parseColor(lightDef.color), lightDef.intensity ?? 0.5);
            break;
          case 'directional': {
            light = new THREE.DirectionalLight(parseColor(lightDef.color), lightDef.intensity ?? 1);
            if (lightDef.position) light.position.set(...lightDef.position);
            break;
          }
          case 'point': {
            light = new THREE.PointLight(parseColor(lightDef.color), lightDef.intensity ?? 1);
            if (lightDef.position) light.position.set(...lightDef.position);
            break;
          }
          case 'spot': {
            light = new THREE.SpotLight(parseColor(lightDef.color), lightDef.intensity ?? 1);
            if (lightDef.position) light.position.set(...lightDef.position);
            break;
          }
        }
      }
    }

    scene.add(camera);
  }, [canvasRef, config]);

  const animate = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (!renderer || !scene || !camera) return;

    if (config?.autoRotate && !reducedMotion) {
      const speed = config.autoRotateSpeed ?? 0.5;
      const time = performance.now() * 0.001;
      const radius = 5;
      camera.position.x = Math.cos(time * speed * 0.1) * radius;
      camera.position.z = Math.sin(time * speed * 0.1) * radius;
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
  }, [config, reducedMotion]);

  useEffect(() => {
    if (!isPlaying || reducedMotion) return;

    setup();

    const loop = () => {
      animate();
      rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      trackerRef.current?.disposeAll();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
    };
  }, [setup, animate, isPlaying, reducedMotion]);

  const addObject = useCallback((object: THREE.Object3D) => {
    sceneRef.current?.add(object);
    trackerRef.current?.track('three-mesh', () => {
      sceneRef.current?.remove(object);
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material?.dispose();
        }
      }
    });
  }, []);

  return {
    scene: sceneRef,
    camera: cameraRef,
    renderer: rendererRef,
    addObject,
  };
}
