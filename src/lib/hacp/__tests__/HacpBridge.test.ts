import { describe, it, expect, beforeEach } from 'vitest';
import { HacpBridge } from '../HacpBridge';
import type { HacpBuilderContext } from '../HacpTypes';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';

describe('HacpBridge & AI Copilot Workspace Engine', () => {
  let bridge: HacpBridge;
  let mockDoc: ReturnType<typeof createBuilderDocument>;
  let mockContext: HacpBuilderContext;

  beforeEach(() => {
    bridge = HacpBridge.getInstance();

    mockDoc = createBuilderDocument({
      id: 'test-store',
      tenantId: 'tenant-test',
      metadata: { storeName: 'Sklep Testowy', storeSlug: 'test-store', locale: 'pl', currency: 'PLN' },
      theme: { primaryColor: '#7c3aed', secondaryColor: '#d946ef', font: 'Inter' },
    });

    // Add initial hero section to test store
    mockDoc.pages[0].sections.push({
      id: 'sec-hero-1',
      type: 'hero',
      label: 'Hero Section',
      props: {
        title: 'Witamy w sklepie',
        subtitle: 'Najwyższa jakość produktów',
        cta: 'Kup teraz',
      },
      order: 0,
      visible: true,
      children: [],
      locked: false,
    });

    mockContext = {
      storeId: 'test-store',
      tenantId: 'tenant-test',
      pageId: mockDoc.pages[0].id,
      pageName: mockDoc.pages[0].name,
      selectedNodeId: 'sec-hero-1',
      selectedNodeType: 'hero',
      selectedNodeLabel: 'Hero Section',
      selectedNodeProps: mockDoc.pages[0].sections[0].props,
      viewport: 'DESKTOP',
      documentNodeCount: 1,
      availableCapabilitiesCount: 12,
    };
  });

  it('D1 — maintains singleton instance and ONLINE status', () => {
    expect(bridge).toBeDefined();
    expect(bridge.getStatus()).toBe('ONLINE');
  });

  it('D2 — registers all 12 core capabilities across READ, BUILD, EDIT, VALIDATION', () => {
    const capabilities = bridge.getCapabilities();
    expect(capabilities.length).toBeGreaterThanOrEqual(12);

    const categories = new Set(capabilities.map((c) => c.category));
    expect(categories.has('READ')).toBe(true);
    expect(categories.has('BUILD')).toBe(true);
    expect(categories.has('EDIT')).toBe(true);
    expect(categories.has('VALIDATION')).toBe(true);

    expect(capabilities.some((c) => c.id === 'configure_experience')).toBe(true);
    expect(capabilities.some((c) => c.id === 'analyze_page')).toBe(true);
    expect(capabilities.some((c) => c.id === 'insert_section')).toBe(true);
  });

  it('D3 — executes analysis query and returns real section structure without mocking', async () => {
    const result = await bridge.executePlan(
      'Przeanalizuj aktualną stronę i powiedz mi, jakie sekcje się na niej znajdują.',
      mockContext,
      mockDoc
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('Hero Section');
    expect(result.message).toContain('sec-hero-1');
    expect(result.executionCard.status).toBe('SUCCESS');
    expect(result.executionCard.validationResult).toBe('PASS');
    expect(result.executionCard.steps.some((s) => s.name.includes('analyze_page'))).toBe(true);
  });

  it('D4 — executes Premium Gold Experience workflow (Test Scenariusz Główny)', async () => {
    const result = await bridge.executePlan(
      'Nadaj tej sekcji bardziej premium charakter. Użyj złotego gradientu i delikatnej reakcji na kursor.',
      mockContext,
      mockDoc
    );

    expect(result.success).toBe(true);
    expect(result.commandsToDispatch.length).toBeGreaterThan(0);

    const updateCmd = result.commandsToDispatch.find((c) => c.type === 'UPDATE_PROPS') as any;
    expect(updateCmd).toBeDefined();
    expect(updateCmd.sectionId).toBe('sec-hero-1');
    expect(updateCmd.props.experienceConfig).toBeDefined();

    // Check real gold mesh-gradient & spotlight configuration
    const exp = updateCmd.props.experienceConfig;
    expect(exp.background.type).toBe('mesh-gradient');
    expect(exp.background.colors).toContain('#D9A86C');
    expect(exp.pointer.type).toBe('spotlight');

    expect(result.executionCard.status).toBe('SUCCESS');
    expect(result.executionCard.appliedChanges?.length).toBe(3);
  });

  it('D5 — modulates Experience motion and speed parameters (Test Trzeci)', async () => {
    mockContext.experienceConfig = {
      motion: { type: 'float', speed: 1.0, intensity: 1.0, direction: 'normal' },
    };

    const result = await bridge.executePlan(
      'Zwiększ delikatnie ruch tego efektu i zmniejsz jego intensywność.',
      mockContext,
      mockDoc
    );

    expect(result.success).toBe(true);
    const updateCmd = result.commandsToDispatch.find((c) => c.type === 'UPDATE_PROPS') as any;
    expect(updateCmd).toBeDefined();

    const motion = updateCmd.props.experienceConfig.motion;
    expect(motion.speed).toBeGreaterThan(1.0);
    expect(motion.intensity).toBeLessThan(1.0);
  });

  it('D6 — emits real-time events to activity stream subscribers', async () => {
    const emittedEvents: any[] = [];
    const unsub = bridge.subscribe((evt) => {
      emittedEvents.push(evt);
    });

    await bridge.executePlan(
      'Stwórz nowoczesny Hero Banner z wbudowanym gradientem SoloSpot Gold.',
      mockContext,
      mockDoc
    );

    unsub();
    expect(emittedEvents.length).toBeGreaterThan(0);
    expect(emittedEvents.some((e) => e.type === 'MUTATE')).toBe(true);
  });
});
