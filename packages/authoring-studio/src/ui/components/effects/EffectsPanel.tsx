/**
 * EffectsPanel.tsx — Sprint S20 Professional Effects UX Panel (ETAP 6)
 *
 * Full-featured Effects Stack UI Panel:
 * - Effect Stack ordering & display
 * - Add Effect dropdown menu (Blur, Drop Shadow, Inner Shadow, Glow, Color Adjustment, Opacity)
 * - Remove / Toggle / Reset / Copy / Paste effect stack
 * - Reactive state updates strictly updating SSOT Scene Graph
 */

import React, { useState } from 'react';
import { Scene } from '../../../scene/SceneGraphModel';
import { EffectDescriptor, createBlurEffect, createColorAdjustmentEffect, createDropShadowEffect, createGlowEffect, createInnerShadowEffect, createOpacityEffect } from '../../../effects/EffectModel';
import { EffectStackEngine } from '../../../effects/EffectStackEngine';
import { EffectStackItem } from './EffectStackItem';

export interface EffectsPanelProps {
  scene: Scene;
  selectedLayerId?: string;
  onSceneChange: (updatedScene: Scene) => void;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  scene,
  selectedLayerId,
  onSceneChange,
}) => {
  const [clipboardStack, setClipboardStack] = useState<ReadonlyArray<EffectDescriptor> | null>(null);

  const selectedLayer = selectedLayerId ? scene.layers[selectedLayerId] : null;

  if (!selectedLayer) {
    return (
      <div style={{ padding: '16px', color: '#94A3B8', fontSize: '13px', textAlign: 'center' }}>
        Select a layer to edit effects.
      </div>
    );
  }

  const effectStack = selectedLayer.effectStack ?? [];

  const handleAddEffect = (type: EffectDescriptor['type']) => {
    const id = `fx_${type}_${Date.now()}`;
    let newEffect: EffectDescriptor;

    switch (type) {
      case 'blur':
        newEffect = createBlurEffect({ id });
        break;
      case 'drop-shadow':
        newEffect = createDropShadowEffect({ id });
        break;
      case 'inner-shadow':
        newEffect = createInnerShadowEffect({ id });
        break;
      case 'glow':
        newEffect = createGlowEffect({ id });
        break;
      case 'color-adjustment':
        newEffect = createColorAdjustmentEffect({ id });
        break;
      case 'opacity':
        newEffect = createOpacityEffect({ id });
        break;
    }

    const updatedScene = EffectStackEngine.mutateSceneLayer(scene, selectedLayer.id, (l) =>
      EffectStackEngine.addEffect(l, newEffect)
    );
    onSceneChange(updatedScene);
  };

  const handleUpdateEffect = (effectId: string, updates: Partial<EffectDescriptor>) => {
    const updatedScene = EffectStackEngine.mutateSceneLayer(scene, selectedLayer.id, (l) =>
      EffectStackEngine.updateEffect(l, effectId, updates)
    );
    onSceneChange(updatedScene);
  };

  const handleToggleEffect = (effectId: string) => {
    const updatedScene = EffectStackEngine.mutateSceneLayer(scene, selectedLayer.id, (l) =>
      EffectStackEngine.toggleEffect(l, effectId)
    );
    onSceneChange(updatedScene);
  };

  const handleRemoveEffect = (effectId: string) => {
    const updatedScene = EffectStackEngine.mutateSceneLayer(scene, selectedLayer.id, (l) =>
      EffectStackEngine.removeEffect(l, effectId)
    );
    onSceneChange(updatedScene);
  };

  const handleReorderEffect = (effectId: string, targetIndex: number) => {
    const updatedScene = EffectStackEngine.mutateSceneLayer(scene, selectedLayer.id, (l) =>
      EffectStackEngine.reorderEffect(l, effectId, targetIndex)
    );
    onSceneChange(updatedScene);
  };

  const handleResetEffect = (effectId: string) => {
    const updatedScene = EffectStackEngine.mutateSceneLayer(scene, selectedLayer.id, (l) =>
      EffectStackEngine.resetEffect(l, effectId)
    );
    onSceneChange(updatedScene);
  };

  const handleCopyStack = () => {
    const stack = EffectStackEngine.copyEffectStack(selectedLayer);
    setClipboardStack(stack);
  };

  const handlePasteStack = () => {
    if (!clipboardStack) return;
    const updatedScene = EffectStackEngine.mutateSceneLayer(scene, selectedLayer.id, (l) =>
      EffectStackEngine.pasteEffectStack(l, clipboardStack)
    );
    onSceneChange(updatedScene);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0F172A', color: '#F8FAFC' }}>
      {/* Header */}
      <div style={{ padding: '12px', borderBottom: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Effects Stack ({effectStack.length})</h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleCopyStack}
            style={{ backgroundColor: '#1E293B', color: '#94A3B8', border: '1px solid #334155', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
            title="Copy Effect Stack"
          >
            Copy Stack
          </button>
          <button
            onClick={handlePasteStack}
            disabled={!clipboardStack}
            style={{
              backgroundColor: '#1E293B',
              color: clipboardStack ? '#F8FAFC' : '#64748B',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: clipboardStack ? 'pointer' : 'not-allowed',
            }}
            title="Paste Effect Stack"
          >
            Paste Stack
          </button>
        </div>
      </div>

      {/* Add Effect Select */}
      <div style={{ padding: '12px', borderBottom: '1px solid #1E293B' }}>
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleAddEffect(e.target.value as EffectDescriptor['type']);
              e.target.value = '';
            }
          }}
          defaultValue=""
          style={{ width: '100%', backgroundColor: '#1E293B', color: '#F8FAFC', border: '1px solid #334155', borderRadius: '4px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}
        >
          <option value="" disabled>+ Add Visual Effect...</option>
          <option value="blur">Blur</option>
          <option value="drop-shadow">Drop Shadow</option>
          <option value="inner-shadow">Inner Shadow</option>
          <option value="glow">Glow</option>
          <option value="color-adjustment">Color Adjustment (Brightness/Contrast/Hue)</option>
          <option value="opacity">Opacity</option>
        </select>
      </div>

      {/* Effect Stack List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {effectStack.length === 0 ? (
          <div style={{ color: '#64748B', fontSize: '12px', textAlign: 'center', paddingTop: '24px' }}>
            No visual effects applied to this layer.
          </div>
        ) : (
          effectStack.map((fx, idx) => (
            <EffectStackItem
              key={fx.id}
              effect={fx}
              index={idx}
              totalCount={effectStack.length}
              onUpdate={handleUpdateEffect}
              onToggle={handleToggleEffect}
              onRemove={handleRemoveEffect}
              onReorder={handleReorderEffect}
              onReset={handleResetEffect}
            />
          ))
        )}
      </div>
    </div>
  );
};
