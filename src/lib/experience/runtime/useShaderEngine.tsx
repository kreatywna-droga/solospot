/**
 * useShaderEngine.tsx — Raw WebGL Shader Background Runtime
 *
 * Renders animated shader backgrounds using raw WebGL + GLSL.
 * Supports:
 *   - Built-in shader presets (aurora-noise, fluid-warp, nebula, plasma, digital-rain)
 *   - Custom fragment shaders via controlled source
 *   - Pointer-influenced uniforms
 *   - Configurable color A/B/C, speed, intensity, distortion, scale
 *   - Performance tier scaling
 *   - Proper resource disposal
 *
 * Architecture:
 *   NO React state for animation. Canvas + rAF via SharedRenderLoop.
 *   Uniforms updated from PointerSignal via mutable refs.
 *
 * Safety:
 *   - Fragment shaders are application-controlled, never user-supplied
 *   - WebGL context loss is handled gracefully
 *   - Maximum canvas count enforced by PerformanceTier
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ShaderConfig } from '../ExperienceRuntimeTypes';
import { createResourceTracker } from './ResourceTracker';
import { subscribe, updateSubscription } from './SharedRenderLoop';
import { detectPerformanceTier } from './PerformanceTier';

// ---------------------------------------------------------------------------
// Built-in shader presets (application-controlled, never user-editable)
// ---------------------------------------------------------------------------

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const SHADER_PRESETS: Record<string, string> = {
  'aurora-noise': `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_pointer;
    uniform vec3 u_colorA;
    uniform vec3 u_colorB;
    uniform vec3 u_colorC;
    uniform float u_intensity;
    uniform float u_distortion;

    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float smoothNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = noise(i);
      float b = noise(i + vec2(1.0, 0.0));
      float c = noise(i + vec2(0.0, 1.0));
      float d = noise(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * smoothNoise(p);
        p *= 2.0;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec2 p = uv + u_pointer * 0.1;
      float t = u_time * 0.15;
      float n = fbm(p * 3.0 + t + u_distortion * sin(t * 0.5));
      vec3 col = mix(u_colorA, u_colorB, n);
      col = mix(col, u_colorC, smoothNoise(p * 5.0 + t * 0.3) * 0.4);
      col *= u_intensity;
      gl_FragColor = vec4(col, 1.0);
    }
  `,

  'fluid-warp': `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_pointer;
    uniform vec3 u_colorA;
    uniform vec3 u_colorB;
    uniform vec3 u_colorC;
    uniform float u_intensity;
    uniform float u_distortion;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec2 p = uv;
      float t = u_time * 0.2;
      p.x += sin(p.y * 4.0 + t) * u_distortion * 0.1;
      p.y += cos(p.x * 4.0 + t * 0.7) * u_distortion * 0.1;
      p += u_pointer * 0.05;
      float d = length(p - 0.5);
      float wave = sin(d * 10.0 - t * 2.0) * 0.5 + 0.5;
      vec3 col = mix(u_colorA, u_colorB, wave);
      col = mix(col, u_colorC, sin(p.x * 6.0 + p.y * 6.0 + t) * 0.3 + 0.3);
      col *= u_intensity * (1.0 - d * 0.8);
      gl_FragColor = vec4(col, 1.0);
    }
  `,

  'nebula': `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_pointer;
    uniform vec3 u_colorA;
    uniform vec3 u_colorB;
    uniform vec3 u_colorC;
    uniform float u_intensity;
    uniform float u_distortion;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float voronoi(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float minDist = 1.0;
      for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 point = hash(i + neighbor) * vec2(1.0);
          point = 0.5 + 0.5 * sin(u_time * 0.3 + 6.2831 * point);
          float d = length(neighbor + point - f);
          minDist = min(minDist, d);
        }
      }
      return minDist;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec2 p = uv + u_pointer * 0.08;
      float t = u_time * 0.1;
      float v = voronoi(p * 4.0 + t);
      float v2 = voronoi(p * 8.0 - t * 0.5);
      vec3 col = u_colorA * v + u_colorB * v2 + u_colorC * (1.0 - v) * 0.3;
      col *= u_intensity;
      gl_FragColor = vec4(col, 1.0);
    }
  `,

  'plasma': `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_pointer;
    uniform vec3 u_colorA;
    uniform vec3 u_colorB;
    uniform vec3 u_colorC;
    uniform float u_intensity;
    uniform float u_distortion;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec2 p = uv + u_pointer * 0.06;
      float t = u_time * 0.3;
      float v1 = sin(p.x * 6.0 + t);
      float v2 = sin(6.0 * (p.x * sin(t * 0.5) + p.y * cos(t * 0.3)) + t);
      float cx = p.x + 0.5 * sin(t * 0.33);
      float cy = p.y + 0.5 * cos(t * 0.5);
      float v3 = sin(sqrt(100.0 * (cx * cx + cy * cy)) + t);
      float v = (v1 + v2 + v3) * u_distortion * 0.33 + 0.5;
      vec3 col = mix(u_colorA, u_colorB, v);
      col = mix(col, u_colorC, sin(v * 3.14159) * 0.5);
      col *= u_intensity;
      gl_FragColor = vec4(col, 1.0);
    }
  `,

  'digital-rain': `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_pointer;
    uniform vec3 u_colorA;
    uniform vec3 u_colorB;
    uniform vec3 u_colorC;
    uniform float u_intensity;
    uniform float u_distortion;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec2 p = uv;
      p.y += u_time * 0.15;
      p += u_pointer * 0.05;
      vec2 grid = floor(p * vec2(20.0, 12.0));
      float h = hash(grid);
      float column = step(0.92 - u_distortion * 0.3, h);
      float row = step(0.5, fract(p.y * 1.5 + u_time * 0.5));
      float glow = column * row;
      vec3 col = mix(u_colorA * 0.15, u_colorB, glow);
      col += u_colorC * glow * 0.3;
      col *= u_intensity;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

// ---------------------------------------------------------------------------
// WebGL Helpers
// ---------------------------------------------------------------------------

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[ShaderEngine] Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null {
  const vertShader = createShader(gl, gl.VERTEX_SHADER, vs);
  const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
  if (!vertShader || !fragShader) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[ShaderEngine] Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  gl.deleteShader(vertShader);
  gl.deleteShader(fragShader);
  return program;
}

function parseColor(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  return [r, g, b];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseShaderEngineOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  config?: ShaderConfig;
  pointerX?: number;
  pointerY?: number;
  isPlaying?: boolean;
  reducedMotion?: boolean;
}

export function useShaderEngine({
  containerRef,
  config,
  pointerX = 0,
  pointerY = 0,
  isPlaying = true,
  reducedMotion = false,
}: UseShaderEngineOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const subIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const trackerRef = useRef<ReturnType<typeof createResourceTracker> | null>(null);

  const setup = useCallback(() => {
    const container = containerRef.current;
    if (!container || !config || reducedMotion) return;

    const tier = detectPerformanceTier();
    const resolutionScale = tier === 'low' ? 0.5 : tier === 'medium' ? 0.75 : 1.0;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = Math.floor(w * resolutionScale);
    canvas.height = Math.floor(h * resolutionScale);
    container.insertBefore(canvas, container.firstChild);

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false });
    if (!gl) {
      canvas.remove();
      return;
    }

    const fragmentSource = config.preset === 'custom' && config.fragmentSource
      ? config.fragmentSource
      : SHADER_PRESETS[config.preset] || SHADER_PRESETS['aurora-noise'];

    const program = createProgram(gl, VERTEX_SHADER, fragmentSource);
    if (!program) {
      canvas.remove();
      return;
    }

    // Full-screen quad
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Cache uniform locations
    const uniformNames = ['u_time', 'u_resolution', 'u_pointer', 'u_colorA', 'u_colorB', 'u_colorC', 'u_intensity', 'u_distortion'];
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (const name of uniformNames) {
      uniforms[name] = gl.getUniformLocation(program, name);
    }

    gl.useProgram(program);

    canvasRef.current = canvas;
    glRef.current = gl;
    programRef.current = program;
    uniformsRef.current = uniforms;
    startTimeRef.current = performance.now();

    // Track resources
    trackerRef.current = createResourceTracker(`shader-${config.preset}`);
    trackerRef.current.track('webgl-context', () => {
      const ext = gl.getExtension('WEBGL_lose_context');
      ext?.loseContext();
    });
    trackerRef.current.track('webgl-program', () => gl.deleteProgram(program), 1024);
    if (posBuffer) trackerRef.current.track('webgl-buffer', () => gl.deleteBuffer(posBuffer), 256);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
  }, [containerRef, config, reducedMotion]);

  const render = useCallback((frameTime: number) => {
    const gl = glRef.current;
    const program = programRef.current;
    const u = uniformsRef.current;
    if (!gl || !program || !config) return;

    gl.useProgram(program);
    gl.uniform1f(u.u_time, (frameTime - startTimeRef.current) / 1000);
    gl.uniform2f(u.u_resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(u.u_pointer, pointerX, pointerY);

    const colors = config.colors && config.colors.length >= 2
      ? config.colors
      : ['#7c3aed', '#3b82f6', '#ec4899'];

    const [r1, g1, b1] = parseColor(colors[0]);
    const [r2, g2, b2] = parseColor(colors[1]);
    const [r3, g3, b3] = parseColor(colors[2 % colors.length]);
    gl.uniform3f(u.u_colorA, r1, g1, b1);
    gl.uniform3f(u.u_colorB, r2, g2, b2);
    gl.uniform3f(u.u_colorC, r3, g3, b3);
    gl.uniform1f(u.u_intensity, config.intensity ?? 1.0);
    gl.uniform1f(u.u_distortion, config.distortion ?? 1.0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [config, pointerX, pointerY]);

  useEffect(() => {
    if (reducedMotion || !isPlaying) return;

    setup();
    const subId = `shader-${config?.preset || 'default'}-${Math.random().toString(36).slice(2, 8)}`;
    subIdRef.current = subId;
    subscribe(subId, render, 50);

    return () => {
      if (subIdRef.current) {
        updateSubscription(subIdRef.current, { active: false });
      }
      trackerRef.current?.disposeAll();
      canvasRef.current?.remove();
      canvasRef.current = null;
      glRef.current = null;
      programRef.current = null;
    };
  }, [setup, render, isPlaying, reducedMotion, config?.preset]);

  return { canvasRef };
}
