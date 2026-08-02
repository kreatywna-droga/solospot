import type { MockSection } from './sections';
import { MOCK_SECTIONS } from './sections';

export interface MockBuilderDocument {
  id: string;
  version: number;
  title: string;
  pages: Array<{
    id: string;
    path: string;
    sections: MockSection[];
  }>;
}

export const MOCK_BUILDER_DOCUMENTS: Record<string, MockBuilderDocument> = {
  landingPageDoc: {
    id: 'doc_landing_001',
    version: 1,
    title: 'Store Landing Page',
    pages: [
      {
        id: 'page_home',
        path: '/',
        sections: [MOCK_SECTIONS.heroBanner, MOCK_SECTIONS.featuredProducts],
      },
    ],
  },
};
