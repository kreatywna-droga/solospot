import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectPlanner } from '../src/ProjectPlanner';

describe('ProjectPlanner', () => {
  let planner: ProjectPlanner;

  beforeEach(() => {
    planner = new ProjectPlanner();
  });

  describe('parse type', () => {
    it('should parse furniture type', () => {
      expect(planner.parseType('Create a furniture store')).toBe('furniture');
    });

    it('should parse fashion type', () => {
      expect(planner.parseType('Fashion store with clothes')).toBe('fashion');
    });

    it('should parse electronics type', () => {
      expect(planner.parseType('Electronics shop')).toBe('electronics');
    });

    it('should parse generic as default', () => {
      expect(planner.parseType('Create something')).toBe('generic');
    });
  });

  describe('plan generation', () => {
    it('should generate plan for furniture store', () => {
      const plan = planner.generateFromPrompt('Create a furniture store with modern pieces');

      expect(plan.pages.length).toBeGreaterThan(0);
      expect(plan.themeTokens.primary).toBe('#8b4513');
    });

    it('should generate plan for fashion store', () => {
      const plan = planner.generateFromPrompt('Fashion store for clothing');

      expect(plan.pages.some(p => p.name === 'Home')).toBe(true);
      expect(plan.themeTokens.secondary).toBe('#000000');
    });

    it('should return default pages for generic prompt', () => {
      const plan = planner.generateFromPrompt('Create a website');

      expect(plan.pages).toContainEqual(expect.objectContaining({ name: 'Home', slug: '/' }));
      expect(plan.pages).toContainEqual(expect.objectContaining({ name: 'Products' }));
    });
  });
});