import { describe, it, expect } from 'vitest';
import { VectorBooleanEngine } from '../VectorBooleanEngine';
import { createRectangleNode } from '../VectorDomainModel';
import { VectorRenderingBridge } from '../../rendering/VectorRenderingBridge';

describe('VectorBooleanEngine Integration with VectorRenderingBridge', () => {
  const rectA = createRectangleNode('rect_a', 0, 0, 100, 100, 0, { color: '#FF0000' }, { width: 0 });
  const rectB = createRectangleNode('rect_b', 50, 50, 100, 100, 0, { color: '#00FF00' }, { width: 0 });

  it('compiles UNION boolean operation into valid DRAW_PATH rendering command', () => {
    const unionPath = VectorBooleanEngine.union(rectA, rectB);
    
    // Result should be a valid immutable domain model
    expect(unionPath.type).toBe('path');
    expect(unionPath.fill?.color).toBe('#FF0000'); // Inherits from nodeA

    // Bridge should compile it correctly
    const commands = VectorRenderingBridge.buildRenderCommands(unionPath);
    
    // Commands: SAVE, TRANSFORM, DRAW_PATH, RESTORE
    expect(commands.length).toBeGreaterThanOrEqual(4);
    
    const drawCmd = commands.find(c => c.type === 'DRAW_PATH');
    expect(drawCmd).toBeDefined();
    
    if (drawCmd && drawCmd.type === 'DRAW_PATH') {
      expect(drawCmd.d).toContain('M 0 0 L 100 0'); // From rectA
      expect(drawCmd.d).toContain('M 50 50 L 150 50'); // From rectB
      expect(drawCmd.bounds.width).toBe(150);
      expect(drawCmd.bounds.height).toBe(150);
      expect(drawCmd.fillStyle).toBe('#FF0000');
    }
  });

  it('compiles SUBTRACT boolean operation into valid DRAW_PATH rendering command', () => {
    const subPath = VectorBooleanEngine.subtract(rectA, rectB);
    
    const commands = VectorRenderingBridge.buildRenderCommands(subPath);
    const drawCmd = commands.find(c => c.type === 'DRAW_PATH');
    expect(drawCmd).toBeDefined();
    if (drawCmd && drawCmd.type === 'DRAW_PATH') {
      expect(drawCmd.d).toBeDefined();
      expect(drawCmd.bounds.width).toBe(100);
    }
  });

  it('compiles INTERSECT boolean operation into valid DRAW_PATH rendering command', () => {
    const intPath = VectorBooleanEngine.intersect(rectA, rectB);
    
    const commands = VectorRenderingBridge.buildRenderCommands(intPath);
    const drawCmd = commands.find(c => c.type === 'DRAW_PATH');
    
    expect(drawCmd).toBeDefined();
    if (drawCmd && drawCmd.type === 'DRAW_PATH') {
      expect(drawCmd.bounds.width).toBe(50);
      expect(drawCmd.bounds.height).toBe(50);
      expect(drawCmd.d).toContain('M 50 50 L 100 50 L 100 100 L 50 100 Z');
    }
  });

  it('compiles XOR boolean operation into valid DRAW_PATH rendering command', () => {
    const xorPath = VectorBooleanEngine.xor(rectA, rectB);
    
    const commands = VectorRenderingBridge.buildRenderCommands(xorPath);
    const drawCmd = commands.find(c => c.type === 'DRAW_PATH');
    
    expect(drawCmd).toBeDefined();
    if (drawCmd && drawCmd.type === 'DRAW_PATH') {
      expect(drawCmd.bounds.width).toBe(150);
      expect(drawCmd.bounds.height).toBe(150);
      expect(drawCmd.d).toContain('M 0 0');
      expect(drawCmd.d).toContain('M 50 50');
    }
  });

  it('handles empty intersection gracefully across the bridge', () => {
    const rectC = createRectangleNode('rect_c', 200, 200, 100, 100, 0, {}, { width: 0 });
    const emptyPath = VectorBooleanEngine.intersect(rectA, rectC);
    
    const commands = VectorRenderingBridge.buildRenderCommands(emptyPath);
    const drawCmd = commands.find(c => c.type === 'DRAW_PATH');
    
    expect(drawCmd).toBeDefined();
    if (drawCmd && drawCmd.type === 'DRAW_PATH') {
      expect(drawCmd.d).toBe('');
      expect(drawCmd.bounds.width).toBe(0);
      expect(drawCmd.bounds.height).toBe(0);
    }
  });

  it('maintains strict immutability of input nodes during boolean ops', () => {
    const rectAStr = JSON.stringify(rectA);
    const rectBStr = JSON.stringify(rectB);

    VectorBooleanEngine.performOperation('union', rectA, rectB);
    VectorBooleanEngine.performOperation('intersect', rectA, rectB);

    expect(JSON.stringify(rectA)).toBe(rectAStr);
    expect(JSON.stringify(rectB)).toBe(rectBStr);
  });
});
