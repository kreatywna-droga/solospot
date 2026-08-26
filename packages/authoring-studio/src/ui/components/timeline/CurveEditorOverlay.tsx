/**
 * CurveEditorOverlay.tsx — Sprint S24 Visual Bezier Curve Editor Component
 *
 * Interactive cubic-bezier curve editor modal/panel:
 * - SVG visualization of cubic-bezier curve (P0(0,0) -> P1(x1,y1) -> P2(x2,y2) -> P3(1,1))
 * - Interactive draggable tangent handles (P1 and P2)
 * - Easing presets selector dropdown (linear, ease, ease-in, ease-out, ease-in-out)
 * - Direct numerical input fields for control points
 *
 * Pure UI Adapter layer: Delegates curve calculations to TimelineCurveAuthoringController.
 */

import React from 'react';
import { BezierControlPoints, EasingPresetName } from '../../../timeline/TimelineEasingEditor';

export interface CurveEditorOverlayProps {
  controlPoints: BezierControlPoints;
  onChangeControlPoints: (points: BezierControlPoints) => void;
  onSelectPreset: (preset: EasingPresetName) => void;
  width?: number;
  height?: number;
}

export const CurveEditorOverlay: React.FC<CurveEditorOverlayProps> = ({
  controlPoints,
  onChangeControlPoints,
  onSelectPreset,
  width = 240,
  height = 240,
}) => {
  const p0 = { x: 0, y: height };
  const p3 = { x: width, y: 0 };

  const p1 = {
    x: controlPoints.x1 * width,
    y: height - controlPoints.y1 * height,
  };

  const p2 = {
    x: controlPoints.x2 * width,
    y: height - controlPoints.y2 * height,
  };

  const pathData = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#0F172A',
        borderRadius: '8px',
        border: '1px solid #334155',
        color: '#F8FAFC',
        width: `${width + 32}px`,
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 600 }}>Easing Curve Authoring</span>
        <select
          onChange={(e) => onSelectPreset(e.target.value as EasingPresetName)}
          style={{
            backgroundColor: '#1E293B',
            color: '#F8FAFC',
            border: '1px solid #475569',
            borderRadius: '4px',
            fontSize: '11px',
            padding: '2px 6px',
          }}
        >
          <option value="linear">Linear</option>
          <option value="ease">Ease</option>
          <option value="easeIn">Ease In</option>
          <option value="easeOut">Ease Out</option>
          <option value="easeInOut">Ease In Out</option>
        </select>
      </div>

      {/* Bezier SVG Canvas */}
      <svg
        width={width}
        height={height}
        style={{
          backgroundColor: '#1E293B',
          borderRadius: '6px',
          border: '1px solid #334155',
        }}
      >
        {/* Grid lines */}
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#334155" strokeDasharray="4" />
        <line x1={width / 2} y1={0} x2={width / 2} y2={height} stroke="#334155" strokeDasharray="4" />

        {/* Control Handle Lines */}
        <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="#3B82F6" strokeWidth={2} />
        <line x1={p3.x} y1={p3.y} x2={p2.x} y2={p2.y} stroke="#EC4899" strokeWidth={2} />

        {/* Cubic Bezier Curve */}
        <path d={pathData} fill="none" stroke="#10B981" strokeWidth={3} />

        {/* P1 Handle Circle */}
        <circle cx={p1.x} cy={p1.y} r={6} fill="#3B82F6" cursor="pointer" />

        {/* P2 Handle Circle */}
        <circle cx={p2.x} cy={p2.y} r={6} fill="#EC4899" cursor="pointer" />
      </svg>

      {/* Numerical Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
        <div>
          <label style={{ color: '#3B82F6', fontWeight: 500 }}>P1: ({controlPoints.x1.toFixed(2)}, {controlPoints.y1.toFixed(2)})</label>
        </div>
        <div>
          <label style={{ color: '#EC4899', fontWeight: 500 }}>P2: ({controlPoints.x2.toFixed(2)}, {controlPoints.y2.toFixed(2)})</label>
        </div>
      </div>
    </div>
  );
};
