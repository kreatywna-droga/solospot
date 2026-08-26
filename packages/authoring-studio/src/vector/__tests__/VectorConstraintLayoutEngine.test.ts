import { VectorConstraintLayoutEngine, BoundingBox } from '../VectorConstraintLayoutEngine';
import { VectorNode } from '../VectorDomainModel';

describe('VectorConstraintLayoutEngine', () => {
  const pOld: BoundingBox = { x: 0, y: 0, width: 200, height: 200 };
  const pNew: BoundingBox = { x: 0, y: 0, width: 400, height: 400 };

  const createChild = (x: number, y: number, w: number, h: number, horiz: any, vert: any): VectorNode => ({
    id: 'test_child',
    type: 'rectangle',
    transform: { x, y, width: w, height: h, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
    constraints: { horizontal: horiz, vertical: vert },
  });

  describe('Horizontal Constraints', () => {
    it('MIN: should maintain distance from left edge', () => {
      const child = createChild(50, 50, 100, 100, 'MIN', 'MIN');
      const res = VectorConstraintLayoutEngine.computeHorizontalConstraint(child, pOld, pNew);
      expect(res.x).toBe(50);
      expect(res.width).toBe(100);
    });

    it('MAX: should maintain distance from right edge', () => {
      const child = createChild(50, 50, 100, 100, 'MAX', 'MIN');
      const res = VectorConstraintLayoutEngine.computeHorizontalConstraint(child, pOld, pNew);
      // parent right was 200, child right was 150 -> distance 50
      // new parent right is 400, so new child right should be 350. width 100 -> x = 250
      expect(res.x).toBe(250);
      expect(res.width).toBe(100);
    });

    it('CENTER: should maintain relative center distance', () => {
      const child = createChild(50, 50, 100, 100, 'CENTER', 'MIN');
      const res = VectorConstraintLayoutEngine.computeHorizontalConstraint(child, pOld, pNew);
      // pOldCenter = 100. childCenter = 100. dist = 0.
      // pNewCenter = 200. new childCenter = 200. width = 100 -> x = 150
      expect(res.x).toBe(150);
      expect(res.width).toBe(100);
    });

    it('STRETCH: should stretch to maintain both left and right distances', () => {
      const child = createChild(50, 50, 100, 100, 'STRETCH', 'MIN');
      const res = VectorConstraintLayoutEngine.computeHorizontalConstraint(child, pOld, pNew);
      // left dist = 50, right dist = 50.
      // new x = 50. new right = 350 -> width = 300
      expect(res.x).toBe(50);
      expect(res.width).toBe(300);
    });

    it('SCALE: should scale proportionally', () => {
      const child = createChild(50, 50, 100, 100, 'SCALE', 'MIN');
      const res = VectorConstraintLayoutEngine.computeHorizontalConstraint(child, pOld, pNew);
      // parent grew by 2x. 
      // x should be 100, width should be 200
      expect(res.x).toBe(100);
      expect(res.width).toBe(200);
    });
  });

  describe('Vertical Constraints', () => {
    it('MIN: should maintain distance from top edge', () => {
      const child = createChild(50, 50, 100, 100, 'MIN', 'MIN');
      const res = VectorConstraintLayoutEngine.computeVerticalConstraint(child, pOld, pNew);
      expect(res.y).toBe(50);
      expect(res.height).toBe(100);
    });

    it('MAX: should maintain distance from bottom edge', () => {
      const child = createChild(50, 50, 100, 100, 'MIN', 'MAX');
      const res = VectorConstraintLayoutEngine.computeVerticalConstraint(child, pOld, pNew);
      // bottom dist = 50. new bottom = 400. new y = 400 - 50 - 100 = 250
      expect(res.y).toBe(250);
      expect(res.height).toBe(100);
    });

    it('CENTER: should maintain relative center distance', () => {
      const child = createChild(50, 50, 100, 100, 'MIN', 'CENTER');
      const res = VectorConstraintLayoutEngine.computeVerticalConstraint(child, pOld, pNew);
      expect(res.y).toBe(150);
      expect(res.height).toBe(100);
    });

    it('STRETCH: should stretch to maintain top and bottom distances', () => {
      const child = createChild(50, 50, 100, 100, 'MIN', 'STRETCH');
      const res = VectorConstraintLayoutEngine.computeVerticalConstraint(child, pOld, pNew);
      expect(res.y).toBe(50);
      expect(res.height).toBe(300);
    });

    it('SCALE: should scale proportionally', () => {
      const child = createChild(50, 50, 100, 100, 'MIN', 'SCALE');
      const res = VectorConstraintLayoutEngine.computeVerticalConstraint(child, pOld, pNew);
      expect(res.y).toBe(100);
      expect(res.height).toBe(200);
    });
  });

  describe('applyGroupConstraints', () => {
    it('should apply constraints to all children', () => {
      const c1 = createChild(50, 50, 100, 100, 'MIN', 'MIN');
      const c2 = createChild(50, 50, 100, 100, 'MAX', 'MAX');
      
      const newChildren = VectorConstraintLayoutEngine.applyGroupConstraints([c1, c2], pOld, pNew);
      
      expect(newChildren[0].transform.x).toBe(50);
      expect(newChildren[0].transform.y).toBe(50);
      
      expect(newChildren[1].transform.x).toBe(250);
      expect(newChildren[1].transform.y).toBe(250);
    });

    it('should apply constraints recursively to nested groups', () => {
      const c1 = createChild(50, 50, 100, 100, 'MAX', 'MAX');
      const nestedGroup = {
        id: 'nested_group',
        type: 'group' as const,
        transform: { x: 50, y: 50, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 },
        constraints: { horizontal: 'MAX', vertical: 'MAX' },
        children: [c1]
      };

      // When pOld scales to pNew, nestedGroup (MAX, MAX) moves to (250, 250).
      // Its width stays 100.
      // So new parent bounds for c1 is old: 50..150, new: 250..350.
      // c1 is (MAX, MAX) relative to nestedGroup.
      // Old right dist from nestedGroup: 150 - (50+100) = 0? Wait, c1 is at 50, width 100.
      // NestedGroup is at 50, width 100. So c1 fills nested group.
      // So c1's x should move relative to nested group's new x.
      // nested group's new x = 250. right dist = 0.
      // c1 new right = 350. c1 new x = 250.
      
      const newChildren = VectorConstraintLayoutEngine.applyGroupConstraints([nestedGroup], pOld, pNew);
      
      expect(newChildren[0].transform.x).toBe(250);
      expect(newChildren[0].transform.y).toBe(250);
      
      const innerChild = (newChildren[0] as any).children[0];
      expect(innerChild.transform.x).toBe(250);
      expect(innerChild.transform.y).toBe(250);
    });
  });
});
