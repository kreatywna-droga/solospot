import { describe, it, expect } from 'vitest';
import {
  createAlphaMask,
  createClippingMask,
  createShapeMask,
  createTextMask,
} from '../MaskModel';
import { MaskStackEngine } from '../MaskStackEngine';
import { MaskAnimationBridge } from '../MaskAnimationBridge';
import { createLayer, Layer } from '../../scene/SceneGraphModel';

describe('MaskStackEngine (Sprint S20 / G1-21 Feature Delivery)', () => {
  const baseLayer: Layer = createLayer({
    id: 'layer_target',
    name: 'Target Layer',
    type: 'rectangle',
    transform: { x: 50, y: 100, width: 200, height: 150 },
  });

  const mask1 = createShapeMask({
    id: 'mask_rect_1',
    name: 'Rect Mask',
    shapeType: 'rectangle',
    bounds: { x: 10, y: 10, width: 80, height: 80 },
  });

  const mask2 = createAlphaMask({
    id: 'mask_alpha_2',
    name: 'Alpha Mask',
    imageSrc: 'assets/alpha_gradient.png',
    opacity: 0.8,
  });

  const mask3 = createTextMask({
    id: 'mask_text_3',
    name: 'Text Mask',
    text: 'HEADLINE',
    fontSize: 48,
  });

  it('adds masks immutably to a layer', () => {
    const layerWithMask1 = MaskStackEngine.addMask(baseLayer, mask1);
    expect(layerWithMask1.maskStack).toHaveLength(1);
    expect(layerWithMask1.maskStack![0].id).toBe('mask_rect_1');
    expect(baseLayer.maskStack).toEqual([]);

    const layerWithMask2 = MaskStackEngine.addMask(layerWithMask1, mask2);
    expect(layerWithMask2.maskStack).toHaveLength(2);
    expect(layerWithMask2.maskStack![1].id).toBe('mask_alpha_2');
  });

  it('removes masks immutably by ID', () => {
    let layer = MaskStackEngine.addMask(baseLayer, mask1);
    layer = MaskStackEngine.addMask(layer, mask2);
    layer = MaskStackEngine.addMask(layer, mask3);
    expect(layer.maskStack).toHaveLength(3);

    const layerAfterRemove = MaskStackEngine.removeMask(layer, 'mask_alpha_2');
    expect(layerAfterRemove.maskStack).toHaveLength(2);
    expect(layerAfterRemove.maskStack!.map((m) => m.id)).toEqual(['mask_rect_1', 'mask_text_3']);
    // Non-existent ID is a no-op
    const noOpLayer = MaskStackEngine.removeMask(layerAfterRemove, 'non_existent_id');
    expect(noOpLayer.maskStack).toHaveLength(2);
  });

  it('reorders masks deterministically within the stack', () => {
    let layer = MaskStackEngine.addMask(baseLayer, mask1);
    layer = MaskStackEngine.addMask(layer, mask2);
    layer = MaskStackEngine.addMask(layer, mask3);

    // Move mask3 to the front (index 0)
    const reordered = MaskStackEngine.reorderMask(layer, 'mask_text_3', 0);
    expect(reordered.maskStack!.map((m) => m.id)).toEqual(['mask_text_3', 'mask_rect_1', 'mask_alpha_2']);

    // Reorder with out-of-bounds index clamps safely
    const clampedEnd = MaskStackEngine.reorderMask(reordered, 'mask_text_3', 999);
    expect(clampedEnd.maskStack!.map((m) => m.id)).toEqual(['mask_rect_1', 'mask_alpha_2', 'mask_text_3']);
  });

  it('toggles mask enabled status', () => {
    let layer = MaskStackEngine.addMask(baseLayer, mask1);
    expect(layer.maskStack![0].enabled).toBe(true);

    const disabled = MaskStackEngine.toggleMask(layer, 'mask_rect_1', false);
    expect(disabled.maskStack![0].enabled).toBe(false);

    const toggledBack = MaskStackEngine.toggleMask(disabled, 'mask_rect_1');
    expect(toggledBack.maskStack![0].enabled).toBe(true);
  });

  it('updates mask properties immutably', () => {
    let layer = MaskStackEngine.addMask(baseLayer, mask2);
    const updated = MaskStackEngine.updateMask(layer, 'mask_alpha_2', { opacity: 0.35, mode: 'luminance' });
    expect(updated.maskStack![0].opacity).toBe(0.35);
    expect(updated.maskStack![0].mode).toBe('luminance');
    // Original layer maskStack unaffected
    expect(layer.maskStack![0].opacity).toBe(0.8);
  });

  it('duplicates a mask with new ID and cloned metadata', () => {
    let layer = MaskStackEngine.addMask(baseLayer, mask1);
    const duplicated = MaskStackEngine.duplicateMask(layer, 'mask_rect_1', 'mask_rect_1_dup');
    expect(duplicated.maskStack).toHaveLength(2);
    expect(duplicated.maskStack![1].id).toBe('mask_rect_1_dup');
    expect(duplicated.maskStack![1].name).toBe('Rect Mask (Copy)');
  });

  it('resets all masks on a layer', () => {
    let layer = MaskStackEngine.addMask(baseLayer, mask1);
    layer = MaskStackEngine.addMask(layer, mask2);
    expect(layer.maskStack).toHaveLength(2);

    const resetLayer = MaskStackEngine.resetMasks(layer);
    expect(resetLayer.maskStack).toEqual([]);
  });

  it('copies and pastes mask stack between layers', () => {
    const sourceLayer = MaskStackEngine.addMask(MaskStackEngine.addMask(baseLayer, mask1), mask2);
    const destinationLayer = createLayer({ id: 'layer_dest', type: 'image' });

    const pasted = MaskStackEngine.copyPasteMasks(sourceLayer, destinationLayer);
    expect(pasted.maskStack).toHaveLength(2);
    expect(pasted.maskStack![0].id).toContain('layer_dest_mask_1');
    expect(pasted.maskStack![1].id).toContain('layer_dest_mask_2');
  });

  it('creates ClippingGroup linking parent mask to child layers', () => {
    const clippingGroup = MaskStackEngine.createClippingGroup(
      baseLayer,
      ['child_layer_1', 'child_layer_2'],
      'M 0 0 L 100 0 L 50 100 Z'
    );
    expect(clippingGroup.maskLayerId).toBe('layer_target');
    expect(clippingGroup.clippedLayerIds).toEqual(['child_layer_1', 'child_layer_2']);
    expect(clippingGroup.clipPath).toBe('M 0 0 L 100 0 L 50 100 Z');
  });

  it('resolves effective mask bounding boxes with layer transforms', () => {
    const layerTransform = {
      x: 100,
      y: 50,
      width: 200,
      height: 200,
      scaleX: 1.5,
      scaleY: 1.5,
      rotationDeg: 0,
      skewX: 0,
      skewY: 0,
    };

    const bounds = MaskStackEngine.resolveEffectiveMaskBounds(mask1, layerTransform);
    expect(bounds.x).toBe(110); // 100 + 10
    expect(bounds.y).toBe(60);  // 50 + 10
    expect(bounds.width).toBe(80); // 80 * 1.0
    expect(bounds.height).toBe(80);
  });

  it('evaluates animated mask properties at playhead time', () => {
    const animatedMask = MaskStackEngine.evaluateMaskAtTime(mask1, {
      opacity: 0.45,
      x: 25,
      y: 35,
      scaleX: 1.2,
      rotationDeg: 45,
    });

    expect(animatedMask.opacity).toBe(0.45);
    expect(animatedMask.transform?.x).toBe(25);
    expect(animatedMask.transform?.y).toBe(35);
    expect(animatedMask.transform?.scaleX).toBe(1.2);
    expect(animatedMask.transform?.rotationDeg).toBe(45);
    // Original mask is untouched
    expect(mask1.opacity).toBe(1.0);
  });

  it('creates mask property animation tracks and builds Mask Timeline DTO', () => {
    const track = MaskAnimationBridge.createMaskTrack('masks.opacity', [
      { id: 'kf_1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
      { id: 'kf_2', timeOffset: 1000, value: 1, easing: { type: 'ease-out' } },
    ]);

    expect(track.propertyKey).toBe('masks.opacity');
    expect(track.keyframes).toHaveLength(2);

    const timeline = MaskAnimationBridge.createMaskTimeline(
      'layer_target',
      'mask_rect_1',
      [track],
      'MaskFadeIn',
      1200,
      'inView'
    );

    expect(timeline.targetNodeId).toBe('layer_target');
    expect(timeline.trigger.type).toBe('inView');
    expect(timeline.clips[0].duration).toBe(1200);
    expect(timeline.clips[0].tracks[0].propertyKey).toBe('masks.opacity');
  });

  it('applies evaluated mask animation properties to a layer mask stack', () => {
    const layerWithMask = MaskStackEngine.addMask(baseLayer, mask1);
    const animatedLayer = MaskAnimationBridge.applyMaskAnimationToLayer(layerWithMask, 'mask_rect_1', {
      opacity: 0.2,
      x: 15,
      y: 25,
    });

    expect(animatedLayer.maskStack![0].opacity).toBe(0.2);
    expect(animatedLayer.maskStack![0].transform?.x).toBe(15);
    expect(animatedLayer.maskStack![0].transform?.y).toBe(25);
  });
});
