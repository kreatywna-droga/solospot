/**
 * Test Utility Factories — TECH-003 Test Infrastructure Consolidation
 *
 * Centralized mock data factories to eliminate test data duplication across the codebase.
 */

export interface MockPropSchema {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
  group?: string;
  options?: Array<{ label: string; value: unknown }>;
  [key: string]: unknown;
}

export interface MockInspectorGroup {
  id: string;
  label: string;
  fields: MockPropSchema[];
}

export interface MockSectionNode {
  id: string;
  type: string;
  label: string;
  props: Record<string, unknown>;
}

export interface MockPageNode {
  id: string;
  slug: string;
  name: string;
  sections: MockSectionNode[];
}

/**
 * Creates a mock PropSchema with sensible defaults and override support.
 */
export function createMockPropSchema(overrides: Partial<MockPropSchema> = {}): MockPropSchema {
  return {
    key: 'testKey',
    label: 'Test Label',
    type: 'string',
    required: false,
    defaultValue: '',
    description: 'Test property description',
    group: 'general',
    ...overrides,
  };
}

/**
 * Creates a mock InspectorGroup containing specified or default fields.
 */
export function createMockInspectorGroup(
  id = 'general',
  label = 'General Settings',
  fields: MockPropSchema[] = [createMockPropSchema()]
): MockInspectorGroup {
  return {
    id,
    label,
    fields,
  };
}

/**
 * Creates a mock Section node for Builder & Canvas testing.
 */
export function createMockSectionNode(overrides: Partial<MockSectionNode> = {}): MockSectionNode {
  return {
    id: 'sec-mock-1',
    type: 'hero',
    label: 'Hero Section',
    props: { title: 'Default Hero Title' },
    ...overrides,
  };
}

/**
 * Creates a mock Page node containing section nodes.
 */
export function createMockPageNode(overrides: Partial<MockPageNode> = {}): MockPageNode {
  return {
    id: 'page-mock-1',
    slug: 'home',
    name: 'Home Page',
    sections: [createMockSectionNode()],
    ...overrides,
  };
}
