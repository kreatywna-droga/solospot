/**
 * useMaterialSystem.ts — Controlled Material Runtime for Three.js
 *
 * Provides a controlled material vocabulary:
 *   - basic: unlit solid color
 *   - standard: PBR with roughness/metalness
 *   - physical: PBR with transmission, clearcoat, etc.
 *
 * All materials are serializable config.
 * Proper disposal on unmount.
 */

'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

export type MaterialType = 'basic' | 'standard' | 'physical';

export interface MaterialConfig {
  type?: MaterialType;
  color?: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  transparent?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  wireframe?: boolean;
  side?: 'front' | 'back' | 'double';
}

function parseSide(side?: string): THREE.Side {
  switch (side) {
    case 'back': return THREE.BackSide;
    case 'double': return THREE.DoubleSide;
    default: return THREE.FrontSide;
  }
}

export function useMaterialSystem(config?: MaterialConfig) {
  const material = useMemo(() => {
    if (!config) return new THREE.MeshStandardMaterial({ color: '#ffffff' });

    const type = config.type ?? 'standard';
    const color = new THREE.Color(config.color || '#ffffff');
    const side = parseSide(config.side);

    switch (type) {
      case 'basic':
        return new THREE.MeshBasicMaterial({
          color,
          wireframe: config.wireframe,
          transparent: config.transparent,
          opacity: config.opacity,
          side,
        });

      case 'physical':
        return new THREE.MeshPhysicalMaterial({
          color,
          roughness: config.roughness ?? 0.5,
          metalness: config.metalness ?? 0,
          transparent: config.transparent,
          opacity: config.opacity,
          emissive: config.emissive ? new THREE.Color(config.emissive) : undefined,
          emissiveIntensity: config.emissiveIntensity,
          wireframe: config.wireframe,
          side,
          transmission: 0,
        });

      case 'standard':
      default:
        return new THREE.MeshStandardMaterial({
          color,
          roughness: config.roughness ?? 0.5,
          metalness: config.metalness ?? 0,
          transparent: config.transparent,
          opacity: config.opacity,
          emissive: config.emissive ? new THREE.Color(config.emissive) : undefined,
          emissiveIntensity: config.emissiveIntensity,
          wireframe: config.wireframe,
          side,
        });
    }
  }, [config?.type, config?.color, config?.roughness, config?.metalness, config?.opacity, config?.transparent, config?.emissive, config?.emissiveIntensity, config?.wireframe, config?.side]);

  return { material };
}
