import { RandomDataHelpers } from '../utils/RandomDataHelpers';

export interface ComponentFixture {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: ComponentFixture[];
}

export interface SectionFixture {
  id: string;
  type: string;
  name: string;
  props: Record<string, any>;
  children: ComponentFixture[];
}

export interface PageFixture {
  id: string;
  slug: string;
  name: string;
  sections: SectionFixture[];
}

export interface RuntimeSnapshotFixture {
  schemaVersion: string;
  documentId: string;
  pages: PageFixture[];
  createdAt: string;
}

export interface PropertyModelFixture {
  borderRadius?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  overflow?: string;
  backgroundColor?: string;
  [key: string]: any;
}

export class BuilderFixtures {
  public static createComponent(override?: Partial<ComponentFixture>): ComponentFixture {
    return {
      id: RandomDataHelpers.randomId('comp'),
      type: 'container',
      props: { padding: '16px' },
      children: [],
      ...override,
    };
  }

  public static createSection(override?: Partial<SectionFixture>): SectionFixture {
    return {
      id: RandomDataHelpers.randomId('sec'),
      type: 'hero',
      name: 'Hero Section',
      props: {
        headline: 'Default Headline',
        subheadline: 'Subheadline text',
      },
      children: [BuilderFixtures.createComponent()],
      ...override,
    };
  }

  public static createPage(override?: Partial<PageFixture>): PageFixture {
    return {
      id: RandomDataHelpers.randomId('page'),
      slug: '/',
      name: 'Strona Główna',
      sections: [BuilderFixtures.createSection()],
      ...override,
    };
  }

  public static createRuntimeSnapshot(override?: Partial<RuntimeSnapshotFixture>): RuntimeSnapshotFixture {
    return {
      schemaVersion: '2.0.0',
      documentId: RandomDataHelpers.randomId('doc'),
      pages: [BuilderFixtures.createPage()],
      createdAt: new Date().toISOString(),
      ...override,
    };
  }

  public static createPropertyModel(override?: Partial<PropertyModelFixture>): PropertyModelFixture {
    return {
      borderRadius: '8px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: '#000000',
      overflow: 'visible',
      backgroundColor: '#ffffff',
      ...override,
    };
  }
}
