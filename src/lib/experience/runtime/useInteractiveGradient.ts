/**
 * useInteractiveGradient.ts — Pointer-Driven WebGL Gradient Background
 *
 * Renders a smooth, multi-stop gradient that responds to pointer position.
 * Uses raw WebGL for GPU-accelerated gradient interpolation with:
 *   - Smooth pointer interpolation (no jank)
 *   - Configurable colors, movement strength, speed, softness, distortion
 *   - Resolution scaling by performance tier
 *   - Proper disposal
 *
 * Unlike CSS gradients, this runs on the GPU and can respond to pointer
 * in real-time without triggering React re-renders.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { InteractiveGradientConfig } from '../ExperienceRuntimeTypes';
import { createResourceTracker } from './ResourceTracker';
import { subscribe, updateSubscription } from './SharedRenderLoop';
import { detectPerformanceTier } from './PerformanceTier';

// ---------------------------------------------------------------------------
// Fragment shader for interactive gradient
// ---------------------------------------------------------------------------

const GRADIENT_FRAGMENT = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_pointer;
  uniform vec3 u_colors[6];
  uniform int u_colorCount;
  uniform float u_strength;
  uniform float u_speed;
  uniform float u_softness;
  uniform float u_distortion;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p = uv;

    // Pointer influence with smooth falloff
    vec2 toPointer = u_pointer - p;
    float pointerDist = length(toPointer);
    float pointerInfluence = exp(-pointerDist * (3.0 - u_softness)) * u_strength;
    p += normalize(toPointer + 0.001) * pointerInfluence * 0.3;

    // Organic distortion
    float t = u_time * u_speed * 0.1;
    p.x += sin(p.y * 4.0 + t) * u_distortion * 0.05;
    p.y += cos(p.x * 4.0 + t * 0.7) * u_distortion * 0.05;

    // Multi-stop gradient blending
    float totalWeight = 0.0;
    vec3 col = vec3(0.0);
    for (int i = 0; i < 6; i++) {
      if (i >= u_colorCount) break;
      float fi = float(i);
      float angle = fi * 6.28318 / float(u_colorCount) + t * 0.2;
      vec2 center = vec2(0.5) + vec2(cos(angle), sin(angle)) * 0.3;
      float d = length(p - center);
      float weight = exp(-d * d * (4.0 - u_softness * 2.0));
      col += u_colors[i] * weight;
      totalWeight += weight;
    }

    col /= max(totalWeight, 0.001);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const VERT_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseColor(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null {
  const v = createShader(gl, gl.VERTEX_SHADER, vs);
  const f = createShader(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    gl.deleteProgram(p);
    return null;
  }
  gl.deleteShader(v);
  gl.deleteShader(f);
  return p;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseInteractiveGradientOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  config?: InteractiveGradientConfig;
  pointerX?: number;
  pointerY?: number;
  isPlaying?: boolean;
  reducedMotion?: boolean;
}

export function useInteractiveGradient({
  containerRef,
  config,
  pointerX = 0,
  pointerY = 0,
  isPlaying = true,
  reducedMotion = false,
}: UseInteractiveGradientOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const subIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const smoothPointer = useRef({ x: 0, y: 0 });
  const trackerRef = useRef<ReturnType<typeof createResourceTracker> | null>(null);

  const setup = useCallback(() => {
    const container = containerRef.current;
    if (!container || !config || reducedMotion) return;

    const tier = detectPerformanceTier();
    const resScale = config.resolution === 'low' ? 0.4 : config.resolution === 'high' ? 1.0
      : tier === 'low' ? 0.4 : tier === 'medium' ? 0.6 : 0.8;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    canvas.width = Math.floor(container.clientWidth * resScale);
    canvas.height = Math.floor(container.clientHeight * resScale);
    container.insertBefore(canvas, container.firstChild);

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) { canvas.remove(); return; }

    const program = createProgram(gl, VERT_SHADER, GRADIENT_FRAGMENT);
    if (!program) { canvas.remove(); return; }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uNames = ['u_time','u_resolution','u_pointer','u_strength','u_speed','u_softness','u_distortion','u_colorCount'];
    const u: Record<string, WebGLUniformLocation | null> = {};
    for (const n of uNames) u[n] = gl.getUniformLocation(program, n);

    // Array uniforms for colors
    for (let i = 0; i < 6; i++) {
      u[`u_colors[${i}]`] = gl.getUniformLocation(program, `u_colors[${i}]`);
    }

    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);

    canvasRef.current = canvas;
    glRef.current = gl;
    programRef.current = program;
    uniformsRef.current = u;
    startTimeRef.current = performance.now();

    trackerRef.current = createResourceTracker('interactive-gradient');
    trackerRef.current.track('webgl-context', () => gl.getExtension('WEBGL_lose_context')?.loseContext());
    trackerRef.current.track('webgl-program', () => gl.deleteProgram(program), 1024);
    if (buf) trackerRef.current.track('webgl-buffer', () => gl.deleteBuffer(buf), 256);
  }, [containerRef, config, reducedMotion]);

  const render = useCallback((frameTime: number) => {
    const gl = glRef.current;
    const u = uniformsRef.current;
    if (!gl || !config) return;

    // Smooth pointer interpolation
    smoothPointer.current.x += (pointerX - smoothPointer.current.x) * 0.08;
    smoothPointer.current.y += (pointerY - smoothPointer.current.y) * 0.08;

    gl.useProgram(programRef.current);
    gl.uniform1f(u.u_time, (frameTime - startTimeRef.current) / 1000);
    gl.uniform2f(u.u_resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(u.u_pointer, smoothPointer.current.x * 0.5 + 0.5, smoothPointer.current.y * 0.5 + 0.5);
    gl.uniform1f(u.u_strength, config.pointerStrength ?? 1.0);
    gl.uniform1f(u.u_speed, config.speed ?? 1.0);
    gl.uniform1f(u.u_softness, config.softness ?? 1.0);
    gl.uniform1f(u.u_distortion, config.distortion ?? 0.5);

    const colors = config.colors?.length >= 2
      ? config.colors
      : ['#7c3aed', '#3b82f6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981'];
    gl.uniform1i(u.u_colorCount, Math.min(colors.length, 6));
    for (let i = 0; i < Math.min(colors.length, 6); i++) {
      const [r, g, b] = parseColor(colors[i]);
      gl.uniform3f(u[`u_colors[${i}]`], r, g, b);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [config, pointerX, pointerY]);

  useEffect(() => {
    if (reducedMotion || !isPlaying) return;
    setup();
    const subId = `gradient-${Math.random().toString(36).slice(2, 8)}`;
    subIdRef.current = subId;
    subscribe(subId, render, 50);

    return () => {
      if (subIdRef.current) updateSubscription(subIdRef.current, { active: false });
      trackerRef.current?.disposeAll();
      canvasRef.current?.remove();
      canvasRef.current = null;
      glRef.current = null;
    };
  }, [setup, render, isPlaying, reducedMotion]);

  return { canvasRef };
}
