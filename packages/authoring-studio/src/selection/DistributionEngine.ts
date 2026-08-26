/**
 * DistributionEngine.ts — Sprint S22 Distribution Engine
 *
 * Implements pure headless distribution:
 * - distribute horizontally (equal spacing between nodes)
 * - distribute vertically (equal spacing between nodes)
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Scene, SceneGraphModel, SceneLayerNode } from '../scene/SceneGraphModel';

export class DistributionEngine {
  /**
   * Distributes selected nodes horizontally or vertically with equal spacing.
   */
  public static distributeSelection(
    scene: Scene,
    selectedNodeIds: ReadonlyArray<string>,
    direction: 'horizontal' | 'vertical'
  ): Scene {
    if (selectedNodeIds.length < 3) return scene; // Requires at least 3 nodes to distribute gaps

    // Fetch and collect node objects
    const nodes: SceneLayerNode[] = [];
    for (const id of selectedNodeIds) {
      const node = SceneGraphModel.findLayerNode(scene, id);
      if (node) nodes.push(node);
    }

    if (nodes.length < 3) return scene;

    let updatedScene = scene;

    if (direction === 'horizontal') {
      // Sort nodes by X coordinate
      nodes.sort((a, b) => a.transform.x - b.transform.x);

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      const minX = first.transform.x;
      const maxX = last.transform.x + last.transform.width;

      const totalNodeWidth = nodes.reduce((sum, n) => sum + n.transform.width, 0);
      const totalGapSpace = maxX - minX - totalNodeWidth;
      const gap = totalGapSpace / (nodes.length - 1);

      let currentX = minX;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        updatedScene = SceneGraphModel.updateLayer(updatedScene, node.id, {
          transform: {
            ...node.transform,
            x: currentX,
            y: node.transform.y,
          },
        });
        currentX += node.transform.width + gap;
      }
    } else {
      // Sort nodes by Y coordinate
      nodes.sort((a, b) => a.transform.y - b.transform.y);

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      const minY = first.transform.y;
      const maxY = last.transform.y + last.transform.height;

      const totalNodeHeight = nodes.reduce((sum, n) => sum + n.transform.height, 0);
      const totalGapSpace = maxY - minY - totalNodeHeight;
      const gap = totalGapSpace / (nodes.length - 1);

      let currentY = minY;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        updatedScene = SceneGraphModel.updateLayer(updatedScene, node.id, {
          transform: {
            ...node.transform,
            x: node.transform.x,
            y: currentY,
          },
        });
        currentY += node.transform.height + gap;
      }
    }

    return updatedScene;
  }
}
