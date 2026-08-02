export interface MockPreviewPayload {
  type: 'DRAG_START' | 'DRAG_MOVE' | 'DRAG_END' | 'UPDATE_PROPS';
  pageId: string;
  sectionId?: string;
  props?: Record<string, any>;
}

export const MOCK_PREVIEW_PAYLOADS: Record<string, MockPreviewPayload> = {
  updatePropsPayload: {
    type: 'UPDATE_PROPS',
    pageId: 'page_home',
    sectionId: 'sec_hero_01',
    props: {
      title: 'Updated Title via PreviewChannel',
    },
  },
};
