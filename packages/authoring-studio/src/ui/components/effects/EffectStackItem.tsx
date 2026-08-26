/**
 * EffectStackItem.tsx — Sprint S20 Professional Effects UX (ETAP 6)
 *
 * Renders individual effect card in the Effect Stack panel:
 * - Enable/Disable toggle
 * - Reorder controls (Move Up / Move Down)
 * - Remove effect button
 * - Parameter sliders & inputs (Radius, Shadow offsets, Color picker, Brightness, Contrast, Saturation, Hue)
 * - Reset effect parameters
 */

import React, { useState } from 'react';
import { EffectDescriptor } from '../../../effects/EffectModel';

export interface EffectStackItemProps {
  effect: EffectDescriptor;
  index: number;
  totalCount: number;
  onUpdate: (effectId: string, updates: Partial<EffectDescriptor>) => void;
  onToggle: (effectId: string) => void;
  onRemove: (effectId: string) => void;
  onReorder: (effectId: string, targetIndex: number) => void;
  onReset: (effectId: string) => void;
  onCopy?: (effect: EffectDescriptor) => void;
}

export const EffectStackItem: React.FC<EffectStackItemProps> = ({
  effect,
  index,
  totalCount,
  onUpdate,
  onToggle,
  onRemove,
  onReorder,
  onReset,
  onCopy,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      style={{
        backgroundColor: '#1E293B',
        border: '1px solid #334155',
        borderRadius: '6px',
        marginBottom: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: '#0F172A',
          borderBottom: isExpanded ? '1px solid #334155' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={effect.enabled}
            onChange={() => onToggle(effect.id)}
            title="Toggle Effect Enable/Disable"
          />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: '#F8FAFC',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              padding: 0,
            }}
          >
            {isExpanded ? '▼' : '►'} {effect.name}
          </button>
          <span
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              backgroundColor: '#334155',
              color: '#94A3B8',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {effect.type}
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => onReorder(effect.id, index - 1)}
            disabled={index === 0}
            style={{
              background: '#334155',
              color: index === 0 ? '#64748B' : '#F8FAFC',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 6px',
              cursor: index === 0 ? 'not-allowed' : 'pointer',
              fontSize: '11px',
            }}
            title="Move Up"
          >
            ↑
          </button>
          <button
            onClick={() => onReorder(effect.id, index + 1)}
            disabled={index === totalCount - 1}
            style={{
              background: '#334155',
              color: index === totalCount - 1 ? '#64748B' : '#F8FAFC',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 6px',
              cursor: index === totalCount - 1 ? 'not-allowed' : 'pointer',
              fontSize: '11px',
            }}
            title="Move Down"
          >
            ↓
          </button>
          {onCopy && (
            <button
              onClick={() => onCopy(effect)}
              style={{
                background: '#334155',
                color: '#F8FAFC',
                border: 'none',
                borderRadius: '3px',
                padding: '2px 6px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
              title="Copy Effect"
            >
              📋
            </button>
          )}
          <button
            onClick={() => onReset(effect.id)}
            style={{
              background: '#334155',
              color: '#F8FAFC',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 6px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
            title="Reset to Defaults"
          >
            ↺
          </button>
          <button
            onClick={() => onRemove(effect.id)}
            style={{
              background: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 6px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
            title="Remove Effect"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Parameter Controls Panel */}
      {isExpanded && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Blur Parameters */}
          {effect.type === 'blur' && (
            <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
              <span>Radius ({effect.radius}px):</span>
              <input
                type="range"
                min={0}
                max={100}
                value={effect.radius}
                onChange={(e) => onUpdate(effect.id, { radius: Number(e.target.value) })}
                style={{ width: '120px' }}
              />
            </label>
          )}

          {/* Drop / Inner Shadow Parameters */}
          {(effect.type === 'drop-shadow' || effect.type === 'inner-shadow') && (
            <>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Color:</span>
                <input
                  type="color"
                  value={effect.color}
                  onChange={(e) => onUpdate(effect.id, { color: e.target.value })}
                  style={{ background: 'none', border: 'none', width: '32px', height: '20px', cursor: 'pointer' }}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Offset X ({effect.offsetX}px):</span>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={effect.offsetX}
                  onChange={(e) => onUpdate(effect.id, { offsetX: Number(e.target.value) })}
                  style={{ width: '120px' }}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Offset Y ({effect.offsetY}px):</span>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={effect.offsetY}
                  onChange={(e) => onUpdate(effect.id, { offsetY: Number(e.target.value) })}
                  style={{ width: '120px' }}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Blur ({effect.blur}px):</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={effect.blur}
                  onChange={(e) => onUpdate(effect.id, { blur: Number(e.target.value) })}
                  style={{ width: '120px' }}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Opacity ({Math.round(effect.opacity * 100)}%):</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={effect.opacity}
                  onChange={(e) => onUpdate(effect.id, { opacity: Number(e.target.value) })}
                  style={{ width: '120px' }}
                />
              </label>
            </>
          )}

          {/* Glow Parameters */}
          {effect.type === 'glow' && (
            <>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Color:</span>
                <input
                  type="color"
                  value={effect.color}
                  onChange={(e) => onUpdate(effect.id, { color: e.target.value })}
                  style={{ background: 'none', border: 'none', width: '32px', height: '20px', cursor: 'pointer' }}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Radius ({effect.radius}px):</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={effect.radius}
                  onChange={(e) => onUpdate(effect.id, { radius: Number(e.target.value) })}
                  style={{ width: '120px' }}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Intensity ({Math.round(effect.intensity * 100)}%):</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={effect.intensity}
                  onChange={(e) => onUpdate(effect.id, { intensity: Number(e.target.value) })}
                  style={{ width: '120px' }}
                />
              </label>
            </>
          )}

          {/* Color Adjustment Parameters */}
          {effect.type === 'color-adjustment' && (
            <>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Brightness ({effect.brightness}%):</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={effect.brightness}
                  onChange={(e) => onUpdate(effect.id, { brightness: Number(e.target.value) })}
                  style={{ width: '120px' }}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Contrast ({effect.contrast}%):</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={effect.contrast}
                  onChange={(e) => onUpdate(effect.id, { contrast: Number(e.target.value) })}
                  style={{ width: '120px' }}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Saturation ({effect.saturation}%):</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={effect.saturation}
                  onChange={(e) => onUpdate(effect.id, { saturation: Number(e.target.value) })}
                  style={{ width: '120px' }}
                />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Hue ({effect.hue}°):</span>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={effect.hue}
                  onChange={(e) => onUpdate(effect.id, { hue: Number(e.target.value) })}
                  style={{ width: '120px' }}
                />
              </label>
            </>
          )}

          {/* Opacity Parameters */}
          {effect.type === 'opacity' && (
            <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
              <span>Opacity ({Math.round(effect.opacity * 100)}%):</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={effect.opacity}
                onChange={(e) => onUpdate(effect.id, { opacity: Number(e.target.value) })}
                style={{ width: '120px' }}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
};
