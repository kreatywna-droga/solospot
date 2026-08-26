/**
 * MaskPanel.tsx — Sprint S20 Professional Mask UX Panel (ETAP 6)
 *
 * Full-featured Mask Stack UI Panel:
 * - Mask Stack display & ordering
 * - Add Mask dropdown menu (Alpha, Clipping, Shape, Text)
 * - Toggle visibility/enable, Opacity control, Mask Mode selector
 * - Remove / Reorder mask operations
 * - Reactive state updates strictly updating SSOT Scene Graph
 */

import React from 'react';
import { Scene } from '../../../scene/SceneGraphModel';
import { Mask, MaskMode, createAlphaMask, createClippingMask, createShapeMask, createTextMask } from '../../../masks/MaskModel';
import { EffectStackEngine } from '../../../effects/EffectStackEngine';

export interface MaskPanelProps {
  scene: Scene;
  selectedLayerId?: string;
  onSceneChange: (updatedScene: Scene) => void;
}

export const MaskPanel: React.FC<MaskPanelProps> = ({
  scene,
  selectedLayerId,
  onSceneChange,
}) => {
  const selectedLayer = selectedLayerId ? scene.layers[selectedLayerId] : null;

  if (!selectedLayer) {
    return (
      <div style={{ padding: '16px', color: '#94A3B8', fontSize: '13px', textAlign: 'center' }}>
        Select a layer to edit masks.
      </div>
    );
  }

  const maskStack = selectedLayer.maskStack ?? [];

  const handleAddMask = (type: Mask['type']) => {
    const id = `mask_${type}_${Date.now()}`;
    let newMask: Mask;

    switch (type) {
      case 'alpha':
        newMask = createAlphaMask({ id, mode: 'alpha' });
        break;
      case 'clipping':
        newMask = createClippingMask({ id, maskLayerId: selectedLayer.parentId ?? selectedLayer.id });
        break;
      case 'shape':
        newMask = createShapeMask({ id, shapeType: 'rectangle' });
        break;
      case 'text':
        newMask = createTextMask({ id, text: 'Mask Text' });
        break;
    }

    const updatedScene = EffectStackEngine.mutateSceneLayer(scene, selectedLayer.id, (l) =>
      EffectStackEngine.addMask(l, newMask)
    );
    onSceneChange(updatedScene);
  };

  const handleUpdateMask = (maskId: string, updates: Partial<Mask>) => {
    const updatedScene = EffectStackEngine.mutateSceneLayer(scene, selectedLayer.id, (l) =>
      EffectStackEngine.updateMask(l, maskId, updates)
    );
    onSceneChange(updatedScene);
  };

  const handleToggleMask = (maskId: string) => {
    const updatedScene = EffectStackEngine.mutateSceneLayer(scene, selectedLayer.id, (l) =>
      EffectStackEngine.toggleMask(l, maskId)
    );
    onSceneChange(updatedScene);
  };

  const handleRemoveMask = (maskId: string) => {
    const updatedScene = EffectStackEngine.mutateSceneLayer(scene, selectedLayer.id, (l) =>
      EffectStackEngine.removeMask(l, maskId)
    );
    onSceneChange(updatedScene);
  };

  const handleReorderMask = (maskId: string, targetIndex: number) => {
    const updatedScene = EffectStackEngine.mutateSceneLayer(scene, selectedLayer.id, (l) =>
      EffectStackEngine.reorderMask(l, maskId, targetIndex)
    );
    onSceneChange(updatedScene);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0F172A', color: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ padding: '12px', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Mask Stack ({maskStack.length})</h3>
      </div>

      {/* Add Mask Select */}
      <div style={{ padding: '12px', borderBottom: '1px solid #1E293B' }}>
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleAddMask(e.target.value as Mask['type']);
              e.target.value = '';
            }
          }}
          defaultValue=""
          style={{ width: '100%', backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '4px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}
        >
          <option value="" disabled>+ Add Mask...</option>
          <option value="alpha">Alpha Mask</option>
          <option value="clipping">Clipping Mask</option>
          <option value="shape">Shape Mask</option>
          <option value="text">Text Mask</option>
        </select>
      </div>

      {/* Mask Stack List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {maskStack.length === 0 ? (
          <div style={{ color: '#64748B', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>
            No masks applied to this layer.
          </div>
        ) : (
          maskStack.map((m, idx) => (
            <div
              key={m.id}
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '6px',
                marginBottom: '8px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Mask Title Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={m.enabled}
                    onChange={() => handleToggleMask(m.id)}
                    title="Toggle Mask Visibility"
                  />
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{m.name}</span>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', backgroundColor: '#334155', color: '#94A3B8', padding: '2px 6px', borderRadius: '4px' }}>
                    {m.type}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleReorderMask(m.id, idx - 1)}
                    disabled={idx === 0}
                    style={{ background: '#334155', color: idx === 0 ? '#64748B' : '#F8FAFC', border: 'none', borderRadius: '3px', padding: '2px 6px', fontSize: '11px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleReorderMask(m.id, idx + 1)}
                    disabled={idx === maskStack.length - 1}
                    style={{ background: '#334155', color: idx === maskStack.length - 1 ? '#64748B' : '#F8FAFC', border: 'none', borderRadius: '3px', padding: '2px 6px', fontSize: '11px', cursor: idx === maskStack.length - 1 ? 'not-allowed' : 'pointer' }}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleRemoveMask(m.id)}
                    style={{ background: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '3px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Mask Controls */}
              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Mask Mode:</span>
                <select
                  value={m.mode}
                  onChange={(e) => handleUpdateMask(m.id, { mode: e.target.value as MaskMode })}
                  style={{ backgroundColor: '#0F172A', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '3px', padding: '2px 6px', fontSize: '11px' }}
                >
                  <option value="alpha">Alpha</option>
                  <option value="inverted-alpha">Inverted Alpha</option>
                  <option value="luminance">Luminance</option>
                  <option value="inverted-luminance">Inverted Luminance</option>
                  <option value="clipping">Clipping</option>
                  <option value="shape">Shape</option>
                  <option value="text">Text</option>
                </select>
              </label>

              <label style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px' }}>
                <span>Opacity ({Math.round(m.opacity * 100)}%):</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={m.opacity}
                  onChange={(e) => handleUpdateMask(m.id, { opacity: Number(e.target.value) })}
                  style={{ width: '120px' }}
                />
              </label>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
