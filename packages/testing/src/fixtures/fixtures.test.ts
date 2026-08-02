import { describe, it, expect } from 'vitest';
import { BuilderFixtures } from './BuilderFixtures';

describe('Builder Fixtures', () => {
  it('should generate component fixture with defaults and overrides', () => {
    const comp = BuilderFixtures.createComponent({ type: 'hero' });
    expect(comp.type).toBe('hero');
    expect(comp.id).toBeDefined();
  });

  it('should generate section fixture', () => {
    const sec = BuilderFixtures.createSection({ name: 'My Hero' });
    expect(sec.name).toBe('My Hero');
    expect(sec.children.length).toBeGreaterThan(0);
  });

  it('should generate page fixture', () => {
    const page = BuilderFixtures.createPage({ slug: '/about' });
    expect(page.slug).toBe('/about');
    expect(page.sections.length).toBe(1);
  });

  it('should generate runtime snapshot fixture', () => {
    const snapshot = BuilderFixtures.createRuntimeSnapshot();
    expect(snapshot.schemaVersion).toBe('2.0.0');
    expect(snapshot.pages.length).toBe(1);
  });

  it('should generate property model fixture', () => {
    const prop = BuilderFixtures.createPropertyModel({ borderRadius: '12px' });
    expect(prop.borderRadius).toBe('12px');
    expect(prop.overflow).toBe('visible');
  });
});
